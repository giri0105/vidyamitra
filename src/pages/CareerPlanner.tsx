import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { careerPlanApi } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
    Route, BookOpen, Play, Calendar, Target, Clock, Award, ExternalLink,
    ChevronDown, ChevronUp, Sparkles, Image as ImageIcon, XCircle, Plus, Download
} from 'lucide-react';

const JOB_ROLES = [
    'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'Data Scientist', 'Data Analyst', 'Machine Learning Engineer', 'DevOps Engineer',
    'Cloud Architect', 'Cybersecurity Analyst', 'Product Manager', 'UI/UX Designer',
    'Mobile Developer', 'QA Engineer', 'Business Analyst', 'Other'
];

const CareerPlanner = () => {
    const { user } = useAuth();
    const [targetRole, setTargetRole] = useState('');
    const [customRole, setCustomRole] = useState('');
    const [skillGaps, setSkillGaps] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<any>(null);
    const [videos, setVideos] = useState<any[]>([]);
    const [images, setImages] = useState<any[]>([]);
    const [expandedWeek, setExpandedWeek] = useState<number | null>(0);
    const [savedPlans, setSavedPlans] = useState<any[]>([]);

    const effectiveRole = targetRole === 'Other' ? customRole : targetRole;

    useEffect(() => {
        const loadPlans = async () => {
            try {
                const data = await careerPlanApi.getAll();
                setSavedPlans((data.plans || []).map((p: any) => ({
                    ...p,
                    training_plan: typeof p.training_plan === 'string' ? JSON.parse(p.training_plan) : p.training_plan,
                    youtube_videos: typeof p.youtube_videos === 'string' ? JSON.parse(p.youtube_videos) : p.youtube_videos,
                    pexels_images: typeof p.pexels_images === 'string' ? JSON.parse(p.pexels_images) : p.pexels_images,
                    skill_gaps: typeof p.skill_gaps === 'string' ? JSON.parse(p.skill_gaps) : p.skill_gaps,
                })));
            } catch { }
        };
        loadPlans();
    }, []);

    const addSkillGap = () => {
        if (skillInput.trim() && !skillGaps.includes(skillInput.trim())) {
            setSkillGaps(prev => [...prev, skillInput.trim()]);
            setSkillInput('');
        }
    };

    const generatePlan = async () => {
        if (!effectiveRole) { toast.error('Select a target role'); return; }
        setLoading(true);
        toast.info('Generating your career roadmap...');

        try {
            const data = await careerPlanApi.generate(effectiveRole, skillGaps.length > 0 ? skillGaps : [effectiveRole]);
            setPlan(data.trainingPlan);
            setVideos(data.videos || []);
            setImages(data.images || []);
            toast.success('Career roadmap generated!');
        } catch (err: any) {
            toast.error(err.message || 'Failed to generate plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold gradient-text">Career Planner & Roadmap</h1>
                    <p className="text-muted-foreground mt-1">Get a personalized learning path powered by AI</p>
                </div>

                {/* Input Section */}
                <Card className="border-border/50">
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Target Career Role *</Label>
                                <Select value={targetRole} onValueChange={setTargetRole}>
                                    <SelectTrigger><SelectValue placeholder="Select a role..." /></SelectTrigger>
                                    <SelectContent>
                                        {JOB_ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {targetRole === 'Other' && (
                                <div><Label>Custom Role</Label><Input value={customRole} onChange={e => setCustomRole(e.target.value)} placeholder="Your target role" /></div>
                            )}
                        </div>

                        <div>
                            <Label>Skill Gaps (optional)</Label>
                            <div className="flex gap-2">
                                <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="Add skills you need to learn..."
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkillGap())} />
                                <Button variant="outline" onClick={addSkillGap}><Plus className="h-4 w-4" /></Button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {skillGaps.map((s, i) => (
                                    <Badge key={i} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSkillGaps(prev => prev.filter((_, j) => j !== i))}>
                                        {s} <XCircle className="h-3 w-3" />
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <Button onClick={generatePlan} disabled={loading || !effectiveRole}
                            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                            {loading ? 'Generating...' : <><Sparkles className="h-4 w-4 mr-2" />Generate Roadmap</>}
                        </Button>
                    </CardContent>
                </Card>

                {loading && (
                    <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="pt-6">
                            <p className="text-sm font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 animate-pulse text-primary" />AI is creating your career roadmap...</p>
                            <Progress value={60} className="mt-3" />
                        </CardContent>
                    </Card>
                )}

                {/* Generated Plan */}
                {plan && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {/* Visual Roadmap */}
                        <Card className="border-border/50 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-violet-500/10 to-purple-500/10">
                                <CardTitle className="flex items-center gap-2"><Route className="h-5 w-5 text-primary" />Visual Roadmap</CardTitle>
                                <CardDescription>{plan.estimatedCompletion || '8 weeks'} • {plan.dailyHours || 2} hrs/day</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {/* Timeline */}
                                <div className="relative">
                                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 via-purple-500 to-pink-500" />
                                    {(plan.weeklyPlan || []).map((week: any, i: number) => (
                                        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                            className="relative pl-10 pb-6 last:pb-0">
                                            <div className={`absolute left-2.5 w-3.5 h-3.5 rounded-full border-2 ${expandedWeek === i ? 'bg-primary border-primary' : 'bg-background border-primary'}`} />
                                            <button onClick={() => setExpandedWeek(expandedWeek === i ? null : i)}
                                                className="w-full text-left p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold text-sm">{week.title || `Week ${week.week}`}</p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {(week.topics || []).slice(0, 3).map((t: string, j: number) => (
                                                                <Badge key={j} variant="outline" className="text-[10px]">{t}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {expandedWeek === i ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </div>
                                                {expandedWeek === i && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-2">
                                                        {(week.goals || []).length > 0 && (
                                                            <div>
                                                                <p className="text-xs font-medium text-primary mb-1">Goals:</p>
                                                                <ul className="text-xs text-muted-foreground space-y-1">
                                                                    {week.goals.map((g: string, k: number) => <li key={k} className="flex items-start gap-1"><Target className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />{g}</li>)}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {(week.resources || []).length > 0 && (
                                                            <div>
                                                                <p className="text-xs font-medium text-primary mb-1">Resources:</p>
                                                                <ul className="text-xs text-muted-foreground space-y-1">
                                                                    {week.resources.map((r: string, k: number) => <li key={k} className="flex items-start gap-1"><BookOpen className="h-3 w-3 mt-0.5 flex-shrink-0" />{r}</li>)}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Milestones */}
                                {(plan.milestones || []).length > 0 && (
                                    <div className="mt-6 p-4 rounded-lg bg-muted/30">
                                        <p className="font-semibold text-sm mb-2 flex items-center gap-2"><Award className="h-4 w-4 text-primary" />Key Milestones</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {plan.milestones.map((m: string, i: number) => (
                                                <div key={i} className="flex items-center gap-2 text-xs"><div className="w-2 h-2 rounded-full bg-primary" />{m}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* YouTube Videos */}
                        {videos.length > 0 && (
                            <Card className="border-border/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base"><Play className="h-4 w-4 text-red-500" />Recommended Videos</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {videos.map((group: any, i: number) => (
                                            <div key={i}>
                                                <p className="text-sm font-medium mb-2">{group.skill}</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {(group.videos || []).map((v: any, j: number) => (
                                                        <a key={j} href={v.url} target="_blank" rel="noopener noreferrer"
                                                            className="flex gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group">
                                                            {v.thumbnail ? (
                                                                <img src={v.thumbnail} alt={v.title} className="w-28 h-20 object-cover rounded-md flex-shrink-0" />
                                                            ) : (
                                                                <div className="w-28 h-20 rounded-md bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                                                    <Play className="h-6 w-6 text-red-500" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">{v.title}</p>
                                                                <p className="text-[10px] text-muted-foreground mt-1">{v.channelTitle}</p>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Pexels / Gemini Images */}
                        {images.length > 0 && (
                            <Card className="border-border/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base"><ImageIcon className="h-4 w-4 text-emerald-500" />Inspiration Gallery</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {images.map((img: any, i: number) => (
                                            <div key={i} className={`rounded-xl overflow-hidden border bg-background flex flex-col ${img.isGemini ? 'col-span-1 md:col-span-2 lg:col-span-3 border-primary/30 shadow-sm' : ''}`}>
                                                <div className="relative group">
                                                    <img src={img.url} alt={img.alt} className={`w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${img.isGemini ? 'h-auto max-h-[400px]' : 'h-48'}`} loading="lazy" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Button variant="secondary" size="sm" className="gap-2 shadow-lg" onClick={() => {
                                                            const fileName = `roadmap-${effectiveRole.replace(/[^a-zA-Z0-9]/g, '-')}-${i}.png`;
                                                            if (img.url.startsWith('data:')) {
                                                                // Handle base64 data URL download
                                                                const link = document.createElement('a');
                                                                link.href = img.url;
                                                                link.download = fileName;
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                document.body.removeChild(link);
                                                            } else {
                                                                // Handle regular URL - fetch as blob
                                                                fetch(img.url)
                                                                    .then(res => res.blob())
                                                                    .then(blob => {
                                                                        const url = URL.createObjectURL(blob);
                                                                        const link = document.createElement('a');
                                                                        link.href = url;
                                                                        link.download = fileName;
                                                                        document.body.appendChild(link);
                                                                        link.click();
                                                                        document.body.removeChild(link);
                                                                        URL.revokeObjectURL(url);
                                                                    })
                                                                    .catch(() => window.open(img.url, '_blank'));
                                                            }
                                                        }}>
                                                            <Download className="h-4 w-4" /> Download Image
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-muted/20 border-t flex items-center justify-between">
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                        {img.isGemini ? <Sparkles className="h-3.5 w-3.5 text-primary" /> : '📷'} {img.photographer}
                                                    </p>
                                                    {img.isGemini && <Badge variant="secondary" className="text-[10px]">AI Generated</Badge>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </motion.div>
                )}

                {/* Saved Plans */}
                {savedPlans.length > 0 && !plan && (
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="text-base">Your Previous Roadmaps</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {savedPlans.map((p: any, i: number) => (
                                    <button key={i} onClick={() => {
                                        setPlan(p.training_plan);
                                        setVideos(p.youtube_videos || []);
                                        setImages(p.pexels_images || []);
                                        setTargetRole(p.target_role || '');
                                    }} className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-sm">{p.target_role}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </Layout>
    );
};

export default CareerPlanner;
