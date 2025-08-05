import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Header, Footer } from '@/components/navbar';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  GraduationCap, 
  Clock, 
  CheckCircle, 
  PlayCircle, 
  FileText, 
  Award,
  BookOpen,
  Target,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface TrainingCourse {
  id: number;
  title: string;
  description: string;
  day: string;
  subject: string;
  contentType: string;
  contentUrl: string;
  duration: number;
  requiredForCertification: boolean;
  certificationLevel: string;
  orderIndex: number;
  completed?: boolean;
  progress?: number;
}

interface UserProgress {
  totalCourses: number;
  completedCourses: number;
  certificationProgress: number;
  currentLevel: string;
  nextLevel: string;
}

const Training = () => {
  const { user, role } = useAuth();
  const [, navigate] = useLocation();
  const [selectedDay, setSelectedDay] = useState('orientation');

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Mock training data based on WinnStorm™ methodology
  const mockCourses: TrainingCourse[] = [
    // Orientation Day
    {
      id: 1,
      title: "Welcome to WinnStorm™",
      description: "Introduction to the Winn Methodology and damage assessment fundamentals",
      day: "orientation",
      subject: "overview",
      contentType: "video",
      contentUrl: "/training/welcome.mp4",
      duration: 45,
      requiredForCertification: true,
      certificationLevel: "both",
      orderIndex: 1,
      completed: true,
      progress: 100
    },
    {
      id: 2,
      title: "Safety Protocols & Equipment",
      description: "Essential safety procedures for roof inspections and thermal imaging",
      day: "orientation",
      subject: "safety",
      contentType: "document",
      contentUrl: "/training/safety-protocols.pdf",
      duration: 30,
      requiredForCertification: true,
      certificationLevel: "both",
      orderIndex: 2,
      completed: true,
      progress: 100
    },
    // Day 1 - Technology & Equipment
    {
      id: 3,
      title: "Thermal Imaging Fundamentals",
      description: "Understanding thermal cameras, infrared radiation, and temperature differentials",
      day: "day1",
      subject: "technology",
      contentType: "video",
      contentUrl: "/training/thermal-fundamentals.mp4",
      duration: 90,
      requiredForCertification: true,
      certificationLevel: "both",
      orderIndex: 3,
      completed: false,
      progress: 60
    },
    {
      id: 4,
      title: "FLIR Camera Operation",
      description: "Hands-on training with FLIR thermal imaging equipment",
      day: "day1",
      subject: "technology",
      contentType: "video",
      contentUrl: "/training/flir-operation.mp4",
      duration: 120,
      requiredForCertification: true,
      certificationLevel: "both",
      orderIndex: 4,
      completed: false,
      progress: 0
    },
    // Day 2 - Inspection Techniques
    {
      id: 5,
      title: "Roof Inspection Methodology",
      description: "The Winn Method for systematic roof damage assessment",
      day: "day2",
      subject: "inspections",
      contentType: "video",
      contentUrl: "/training/inspection-methodology.mp4",
      duration: 150,
      requiredForCertification: true,
      certificationLevel: "both",
      orderIndex: 5,
      completed: false,
      progress: 0
    },
    {
      id: 6,
      title: "Moisture Detection Techniques",
      description: "Advanced methods for identifying water intrusion and damage",
      day: "day2",
      subject: "inspections",
      contentType: "video",
      contentUrl: "/training/moisture-detection.mp4",
      duration: 100,
      requiredForCertification: true,
      certificationLevel: "both",
      orderIndex: 6,
      completed: false,
      progress: 0
    }
  ];

  const mockProgress: UserProgress = {
    totalCourses: mockCourses.length,
    completedCourses: mockCourses.filter(c => c.completed).length,
    certificationProgress: 35,
    currentLevel: "Junior Consultant",
    nextLevel: "Senior Consultant"
  };

  const dayOptions = [
    { value: 'orientation', label: 'Orientation', icon: GraduationCap },
    { value: 'day1', label: 'Day 1 - Technology', icon: PlayCircle },
    { value: 'day2', label: 'Day 2 - Inspections', icon: Target },
    { value: 'day3', label: 'Day 3 - Sales & Insurance', icon: TrendingUp },
  ];

  const filteredCourses = mockCourses.filter(course => course.day === selectedDay);

  return (
    <div className="min-h-screen flex flex-col relative bg-background text-foreground">
      <Header />
      
      <main className="flex-grow pb-20">
        <div className="p-6">
          {/* Training Portal Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-cyan-500/20 rounded-xl">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <div className="ml-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                  Training Portal
                </h1>
                <p className="text-muted-foreground">WinnStorm™ Certification Program</p>
              </div>
            </div>
            
            {/* Progress Overview */}
            <Card className="bg-gradient-to-r from-primary/5 to-cyan-500/5 border-primary/20">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center mb-2">
                      <Award className="h-5 w-5 text-primary mr-2" />
                      <span className="font-semibold">Current Level</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">{mockProgress.currentLevel}</div>
                    <div className="text-sm text-muted-foreground">
                      Progress to {mockProgress.nextLevel}
                    </div>
                    <Progress value={mockProgress.certificationProgress} className="mt-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {mockProgress.certificationProgress}% Complete
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <BookOpen className="h-5 w-5 text-cyan-500 mr-2" />
                      <span className="font-semibold">Course Progress</span>
                    </div>
                    <div className="text-2xl font-bold text-cyan-600">
                      {mockProgress.completedCourses}/{mockProgress.totalCourses}
                    </div>
                    <div className="text-sm text-muted-foreground">Courses Completed</div>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="font-semibold">Study Time</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.floor(mockCourses.reduce((acc, course) => acc + (course.completed ? course.duration : 0), 0) / 60)}h
                    </div>
                    <div className="text-sm text-muted-foreground">Hours Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Training Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Day Navigation */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Training Days</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {dayOptions.map((day) => {
                      const Icon = day.icon;
                      const dayCourses = mockCourses.filter(c => c.day === day.value);
                      const completedCount = dayCourses.filter(c => c.completed).length;
                      
                      return (
                        <Button
                          key={day.value}
                          variant={selectedDay === day.value ? "default" : "ghost"}
                          className="w-full justify-start p-4 h-auto"
                          onClick={() => setSelectedDay(day.value)}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="h-5 w-5" />
                            <div className="text-left">
                              <div className="font-medium">{day.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {completedCount}/{dayCourses.length} completed
                              </div>
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Course Content */}
            <div className="lg:col-span-3">
              <div className="space-y-4">
                {filteredCourses.map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="flex items-center space-x-2">
                              {course.completed ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : course.progress && course.progress > 0 ? (
                                <PlayCircle className="h-5 w-5 text-primary" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                              )}
                              <h3 className="text-lg font-semibold">{course.title}</h3>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">
                                {course.subject}
                              </Badge>
                              {course.requiredForCertification && (
                                <Badge variant="outline" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-muted-foreground mb-3">{course.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {course.duration} minutes
                            </div>
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              {course.contentType}
                            </div>
                          </div>
                          
                          {course.progress && course.progress > 0 && !course.completed && (
                            <div className="mt-3">
                              <Progress value={course.progress} className="h-2" />
                              <div className="text-xs text-muted-foreground mt-1">
                                {course.progress}% complete
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4">
                          <Button
                            variant={course.completed ? "outline" : "default"}
                            size="sm"
                          >
                            {course.completed ? "Review" : course.progress && course.progress > 0 ? "Continue" : "Start"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Training;