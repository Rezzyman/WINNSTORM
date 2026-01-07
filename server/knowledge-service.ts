import OpenAI from "openai";
import { storage } from "./storage";
import type { KnowledgeDocument, KnowledgeEmbedding, InsertKnowledgeEmbedding } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1"
});

const EMBEDDING_MODEL = "text-embedding-3-small";
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const MAX_SEARCH_RESULTS = 5;
const SIMILARITY_THRESHOLD = 0.7;

export interface SemanticSearchResult {
  document: KnowledgeDocument;
  chunk: string;
  chunkIndex: number;
  similarity: number;
}

function chunkText(text: string, chunkSize: number = CHUNK_SIZE, overlap: number = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  if (!text || text.length === 0) return chunks;

  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);
    
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > chunkSize * 0.5) {
        chunk = chunk.slice(0, breakPoint + 1);
      }
    }
    
    chunks.push(chunk.trim());
    start += chunk.length - overlap;
    if (start <= chunks[chunks.length - 1]?.length - overlap) {
      start = chunks[chunks.length - 1]?.length || start + chunkSize;
    }
  }
  
  return chunks.filter(c => c.length > 50);
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OpenAI API key not configured - cannot generate embeddings');
    throw new Error('OpenAI API key not configured');
  }
  
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.substring(0, 8000),
    });
    return response.data[0]?.embedding || null;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

export async function generateDocumentEmbeddings(documentId: number): Promise<boolean> {
  try {
    const document = await storage.getKnowledgeDocumentById(documentId);
    if (!document || !document.content) {
      console.log(`Document ${documentId} not found or has no content`);
      return false;
    }

    await storage.deleteKnowledgeEmbeddingsByDocument(documentId);
    
    const fullText = `${document.title}\n${document.description || ''}\n${document.content}`;
    const chunks = chunkText(fullText);
    
    console.log(`Processing ${chunks.length} chunks for document ${documentId}`);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);
      
      if (embedding) {
        const embeddingData: InsertKnowledgeEmbedding = {
          documentId,
          chunkIndex: i,
          chunkContent: chunk,
          embedding,
          tokenCount: Math.ceil(chunk.length / 4),
        };
        
        await storage.createKnowledgeEmbedding(embeddingData);
      }
    }
    
    await storage.updateKnowledgeDocument(documentId, {
      metadata: {
        ...document.metadata,
        processingStatus: 'completed',
        embeddingsGenerated: true,
        embeddingCount: chunks.length,
      }
    });
    
    console.log(`Generated ${chunks.length} embeddings for document ${documentId}`);
    return true;
  } catch (error) {
    console.error(`Error generating embeddings for document ${documentId}:`, error);
    
    try {
      const document = await storage.getKnowledgeDocumentById(documentId);
      if (document) {
        await storage.updateKnowledgeDocument(documentId, {
          metadata: {
            ...document.metadata,
            processingStatus: 'failed',
            processingError: error instanceof Error ? error.message : 'Unknown error',
          }
        });
      }
    } catch (updateError) {
      console.error('Error updating document status:', updateError);
    }
    
    return false;
  }
}

export async function semanticSearch(query: string, limit: number = MAX_SEARCH_RESULTS): Promise<SemanticSearchResult[]> {
  try {
    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding) {
      console.log('Failed to generate query embedding');
      return [];
    }

    const allEmbeddings = await storage.getAllKnowledgeEmbeddingsWithDocs();
    
    if (allEmbeddings.length === 0) {
      console.log('No embeddings in knowledge base');
      return [];
    }

    const results: SemanticSearchResult[] = [];
    
    for (const item of allEmbeddings) {
      if (!item.embedding) continue;
      
      const similarity = cosineSimilarity(queryEmbedding, item.embedding as number[]);
      
      if (similarity >= SIMILARITY_THRESHOLD) {
        results.push({
          document: item.document,
          chunk: item.chunkContent,
          chunkIndex: item.chunkIndex,
          similarity,
        });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, limit);
  } catch (error) {
    console.error('Error performing semantic search:', error);
    return [];
  }
}

export async function hybridSearch(query: string, limit: number = MAX_SEARCH_RESULTS): Promise<SemanticSearchResult[]> {
  try {
    const [semanticResults, keywordDocs] = await Promise.all([
      semanticSearch(query, limit),
      storage.searchKnowledgeDocuments(query),
    ]);

    const seenDocIds = new Set(semanticResults.map(r => r.document.id));
    
    for (const doc of keywordDocs) {
      if (!seenDocIds.has(doc.id) && semanticResults.length < limit) {
        semanticResults.push({
          document: doc,
          chunk: doc.content?.substring(0, CHUNK_SIZE) || doc.description || doc.title,
          chunkIndex: 0,
          similarity: 0.5,
        });
        seenDocIds.add(doc.id);
      }
    }

    return semanticResults.slice(0, limit);
  } catch (error) {
    console.error('Error performing hybrid search:', error);
    return [];
  }
}

export function formatSearchResultsForContext(results: SemanticSearchResult[]): string {
  if (results.length === 0) return '';

  let context = '\n\n## WinnStorm Knowledge Base:\n';
  
  const docGroups = new Map<number, SemanticSearchResult[]>();
  for (const result of results) {
    const docId = result.document.id;
    if (!docGroups.has(docId)) {
      docGroups.set(docId, []);
    }
    docGroups.get(docId)!.push(result);
  }

  let totalChars = 0;
  const MAX_CHARS = 12000;

  for (const [docId, chunks] of Array.from(docGroups)) {
    if (totalChars >= MAX_CHARS) break;
    
    const doc = chunks[0].document;
    const sortedChunks = chunks.sort((a: SemanticSearchResult, b: SemanticSearchResult) => a.chunkIndex - b.chunkIndex);
    
    let docSection = `\n### ${doc.title} (${doc.documentType})`;
    if (doc.description) {
      docSection += `\n${doc.description}`;
    }
    docSection += '\n';
    
    for (const chunk of sortedChunks) {
      if (totalChars + chunk.chunk.length > MAX_CHARS) {
        const remaining = MAX_CHARS - totalChars;
        if (remaining > 200) {
          docSection += chunk.chunk.substring(0, remaining) + '...';
        }
        break;
      }
      docSection += chunk.chunk + '\n';
    }
    
    context += docSection;
    totalChars += docSection.length;
  }
  
  context += '\n\n[Use the above WinnStorm knowledge base content as your primary source. Only supplement with general knowledge when the KB doesn\'t cover the topic.]';
  
  return context;
}
