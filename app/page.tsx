'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type ContentData = {
    siteTitle: string;
    projects: {
        id: string;
        title: string;
        isHome?: boolean;
        meta?: string;
        year?: string;
        count: number;
        images: string[];
    }[];
    about: {
        contact: {
            email: string;
            instagram: string;
        };
        bio: {
            text: string;
            locations: string;
        };
        education: {
            degrees: string;
            school: string;
            year: string;
        };
        publications: {
            title: string;
            publisher: string;
            volume: string;
            year: string;
        }[];
        shows: {
            title: string;
            location: string;
            year: string;
        }[];
    };
};

export default function Home() {
    // --- State ---
    const [content, setContent] = useState<ContentData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // --- Effects ---
    useEffect(() => {
        fetchContent();
    }, []);

    // --- Actions ---
    const fetchContent = async () => {
        try {
            const res = await fetch('/api/content');
            const data = await res.json();
            setContent(data);
        } catch (err) {
            console.error('Failed to load content', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!content) return;
        try {
            const res = await fetch('/api/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(content),
            });
            if (res.ok) {
                setIsEditing(false);
                alert('Changes saved!');
            } else {
                alert('Failed to save changes.');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving content.');
        }
    };

    const handleCancel = () => {
        fetchContent(); // Re-fetch to discard changes
        setIsEditing(false);
    };

    const checkPassword = () => {
        if (password === process.env.NEXT_PUBLIC_EDIT_PASSWORD) {
            setIsEditing(true);
            setShowAuth(false);
            setPassword('');
            setError('');
        } else {
            setError('Incorrect password');
        }
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- Update Handlers ---

    // Update main site title
    const updateSiteTitle = (val: string) => {
        if (!content) return;
        setContent({ ...content, siteTitle: val });
    };

    // Update a specific project field
    const updateProject = (index: number, field: string, value: any) => {
        if (!content) return;
        const newProjects = [...content.projects];
        newProjects[index] = { ...newProjects[index], [field]: value };
        setContent({ ...content, projects: newProjects });
    };

    // Update 'About' section
    const updateAbout = (section: keyof ContentData['about'], field: string, value: string) => {
        if (!content) return;
        const newAbout = { ...content.about };
        // @ts-ignore
        newAbout[section] = { ...newAbout[section], [field]: value };
        setContent({ ...content, about: newAbout });
    };

    // Update Publication (Array)
    const updatePublication = (index: number, field: string, value: string) => {
        if (!content) return;
        const newPubs = [...content.about.publications];
        // @ts-ignore
        newPubs[index] = { ...newPubs[index], [field]: value };
        const newAbout = { ...content.about, publications: newPubs };
        setContent({ ...content, about: newAbout });
    };

    // Update Show (Array)
    const updateShow = (index: number, field: string, value: string) => {
        if (!content) return;
        const newShows = [...content.about.shows];
        // @ts-ignore
        newShows[index] = { ...newShows[index], [field]: value };
        const newAbout = { ...content.about, shows: newShows };
        setContent({ ...content, about: newAbout });
    };

    // --- New Page/Project Actions ---
    const addPage = () => {
        if (!content) return;
        const newId = `project-${Date.now()}`;
        const newProject = {
            id: newId,
            title: "New Project",
            count: 0,
            images: []
        };
        setContent({ ...content, projects: [...content.projects, newProject] });
    };

    const deletePage = (index: number) => {
        if (!content) return;
        if (content.projects[index].isHome) return;
        const newProjects = content.projects.filter((_, i) => i !== index);
        setContent({ ...content, projects: newProjects });
    };

    const movePage = (index: number, direction: 'up' | 'down') => {
        if (!content) return;
        const newProjects = [...content.projects];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newProjects.length) return;

        // Don't allow moving anything above Home if Home is at 0
        if (targetIndex === 0 && newProjects[0].isHome) return;
        if (index === 0 && newProjects[0].isHome) return;

        const [moved] = newProjects.splice(index, 1);
        newProjects.splice(targetIndex, 0, moved);
        setContent({ ...content, projects: newProjects });
    };


    if (isLoading || !content) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <main className="relative w-full">

            {/* --- UI: Secret Button & Auth --- */}
            {!isEditing && (
                <button
                    onClick={() => setShowAuth(true)}
                    className="fixed top-4 right-4 w-3 h-3 rounded-full bg-transparent hover:bg-black/5 transition-colors z-[100] outline-none cursor-default"
                    aria-label="Edit Mode"
                />
            )}

            {showAuth && (
                <div className="fixed inset-0 z-[101] bg-black/20 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white p-6 shadow-xl border w-80">
                        <h3 className="text-sm font-medium mb-4">Enter Password</h3>
                        <input
                            type="password"
                            className="w-full border p-2 mb-2 text-sm outline-none focus:border-black"
                            placeholder="Password..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && checkPassword()}
                            autoFocus
                        />
                        {error && <p className="text-red-500 text-[10px] mb-2">{error}</p>}
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setShowAuth(false); setPassword(''); setError(''); }} className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                            <button onClick={checkPassword} className="text-xs px-3 py-1 bg-black text-white hover:opacity-80 transition-opacity">Submit</button>
                        </div>
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="fixed top-4 right-4 z-[100] flex gap-2">
                    <div className="bg-white/80 backdrop-blur-md border border-gray-200 p-4 shadow-lg flex flex-col gap-4 max-h-[80vh] overflow-y-auto w-64">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Page Manager</h3>
                        <div className="flex flex-col gap-2">
                            {content.projects.map((p, i) => (
                                <div key={p.id} className="flex items-center justify-between gap-2 p-2 border border-gray-100 bg-white group text-[10px]">
                                    <span className="truncate flex-1">{p.isHome ? "Home (Pinned)" : p.title || "Untitled"}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!p.isHome && i > 1 && (
                                            <button onClick={() => movePage(i, 'up')} className="hover:bg-gray-100 p-1">↑</button>
                                        )}
                                        {!p.isHome && i < content.projects.length - 1 && (
                                            <button onClick={() => movePage(i, 'down')} className="hover:bg-gray-100 p-1">↓</button>
                                        )}
                                        {!p.isHome && (
                                            <button onClick={() => deletePage(i)} className="hover:bg-red-50 text-red-500 p-1">×</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addPage}
                            className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-[10px] uppercase font-bold border border-dashed border-gray-300 transition-colors"
                        >
                            + Add Page
                        </button>
                        <hr />
                        <div className="flex gap-2">
                            <button onClick={handleCancel} className="flex-1 bg-white border border-gray-300 text-black text-[10px] uppercase font-bold py-2 hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={handleSave} className="flex-1 bg-black text-white text-[10px] uppercase font-bold py-2 hover:opacity-80 transition-opacity">Save</button>
                        </div>
                    </div>
                </div>
            )}


            {/* --- Main Layout --- */}

            {/* 1. Fixed Name (Left) */}
            <div className="fixed top-8 left-5 md:top-1/2 md:-translate-y-1/2 md:left-6 z-50">
                {isEditing ? (
                    <input
                        className="text-sm md:text-base font-medium tracking-tight border-b border-black outline-none bg-transparent w-32"
                        value={content.siteTitle}
                        onChange={(e) => updateSiteTitle(e.target.value)}
                    />
                ) : (
                    <button
                        onClick={scrollToTop}
                        className="text-sm md:text-base font-medium tracking-tight hover:opacity-70 transition-opacity"
                    >
                        {content.siteTitle}
                    </button>
                )}
            </div>

            {/* 2. Scrollable Content Stream */}
            <div className="flex flex-col items-center w-full">
                {content.projects.map((project, index) => (
                    <section key={project.id} id={project.id} className="min-h-screen py-32 flex items-center justify-center w-full">
                        {project.isHome ? (
                            <HomeSlideshow
                                project={project}
                                isEditing={isEditing}
                                onUpdate={(field, val) => updateProject(index, field, val as any)}
                            />
                        ) : (
                            <Gallery
                                project={project}
                                isEditing={isEditing}
                                onUpdate={(field, val) => updateProject(index, field, val as any)}
                            />
                        )}
                    </section>
                ))}

                {/* About Section */}
                <section id="about" className="min-h-screen py-32 flex items-center justify-center w-full bg-white">
                    <AboutContent
                        data={content.about}
                        isEditing={isEditing}
                        onUpdateAbout={updateAbout}
                        onUpdatePub={updatePublication}
                        onUpdateShow={updateShow}
                    />
                </section>
            </div>

            {/* 3. Fixed Bottom Key Navigation */}
            <div className="fixed bottom-5 md:bottom-6 left-5 md:left-6 flex flex-col gap-1 z-50 text-[10px] md:text-xs mix-blend-multiply leading-[0.6]">
                {content.projects.filter(p => !p.isHome).map(p => (
                    <button key={p.id} onClick={() => scrollToSection(p.id)} className="text-left hover:opacity-70 transition-opacity">
                        {p.title}
                    </button>
                ))}
            </div>

            <div className="fixed bottom-5 md:bottom-6 right-5 md:right-6 flex flex-col gap-1 items-end z-50 text-[10px] md:text-xs mix-blend-multiply leading-[0.6]">
                <button onClick={() => scrollToSection('about')} className="hover:opacity-70 transition-opacity">
                    About
                </button>
                <a href="https://substack.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                    Substack
                </a>
            </div>

        </main>
    );
}

// --- Subcomponents ---

function Gallery({
    project,
    isEditing,
    onUpdate
}: {
    project: ContentData['projects'][0],
    isEditing: boolean,
    onUpdate: (field: string, val: any) => void
}) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const handleNextImage = () => {
        if (isEditing) return; // Disable slideshow click when editing to avoid confusion
        setCurrentImageIndex((prev) => (prev + 1) % project.images.length);
    };

    return (
        <div className="flex flex-col items-center max-w-4xl mx-auto text-center" >

            {/* Image Container */}
            <div
                className={`relative overflow-hidden shadow-sm transition-all text-black ${!isEditing && 'cursor-pointer hover:opacity-95'}`}
                onClick={handleNextImage}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-center"
                    >
                        <img
                            src={project.images[currentImageIndex]}
                            alt={`${project.title} ${currentImageIndex + 1}`}
                            className="h-[460px] md:h-[613px] w-auto object-contain"
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Info and Click Hint */}
            <div className="mt-4 flex flex-col items-center gap-1 w-full">

                <div className="text-xs leading-relaxed uppercase tracking-wide flex flex-col items-center gap-1 w-full">

                    {/* Title */}
                    {isEditing ? (
                        <input
                            className="text-center border-b border-gray-300 outline-none w-full max-w-[200px]"
                            value={project.title}
                            onChange={(e) => onUpdate('title', e.target.value)}
                        />
                    ) : (
                        <span>{project.title}</span>
                    )}

                    <div className="flex flex-wrap justify-center gap-1">
                        {/* Meta */}
                        {isEditing ? (
                            <textarea
                                className="text-center border border-gray-300 outline-none w-64 text-[10px] min-h-[40px]"
                                value={project.meta || ''}
                                onChange={(e) => onUpdate('meta', e.target.value)}
                                placeholder="Meta info..."
                            />
                        ) : (
                            project.meta && <span className="mx-1">• {project.meta.replace(/\n/g, ' ')}</span>
                        )}

                        {/* Year */}
                        {isEditing ? (
                            <input
                                className="text-center border-b border-gray-300 outline-none w-12"
                                value={project.year || ''}
                                onChange={(e) => onUpdate('year', e.target.value)}
                                placeholder="Year"
                            />
                        ) : (
                            project.year && <span className="mx-1">• {project.year}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Editing: Image Management */}
            {isEditing && (
                <div className="mt-8 w-full max-w-2xl px-4">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-4">Manage Images</h4>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {project.images.map((img, idx) => (
                            <div key={idx} className="relative group aspect-[3/4] bg-gray-50 border border-gray-200">
                                <img src={img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                    {idx > 0 && (
                                        <button
                                            onClick={() => {
                                                const newImgs = [...project.images];
                                                [newImgs[idx - 1], newImgs[idx]] = [newImgs[idx], newImgs[idx - 1]];
                                                onUpdate('images', newImgs as any);
                                            }}
                                            className="bg-white text-black p-1 text-[10px]"
                                        >
                                            ←
                                        </button>
                                    )}
                                    {idx < project.images.length - 1 && (
                                        <button
                                            onClick={() => {
                                                const newImgs = [...project.images];
                                                [newImgs[idx + 1], newImgs[idx]] = [newImgs[idx], newImgs[idx + 1]];
                                                onUpdate('images', newImgs as any);
                                            }}
                                            className="bg-white text-black p-1 text-[10px]"
                                        >
                                            →
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            const newImgs = project.images.filter((_, i) => i !== idx);
                                            onUpdate('images', newImgs as any);
                                        }}
                                        className="bg-red-500 text-white p-1 text-[10px]"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                        <label className="aspect-[3/4] border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                                type="file"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('projectId', project.id);
                                    try {
                                        const res = await fetch('/api/upload', {
                                            method: 'POST',
                                            body: formData
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            onUpdate('images', [...project.images, data.path] as any);
                                        }
                                    } catch (err) {
                                        console.error('Upload failed', err);
                                    }
                                }}
                            />
                            <span className="text-xl text-gray-400">+</span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Home Slideshow ---
function HomeSlideshow({ project, isEditing, onUpdate }: {
    project: ContentData['projects'][0],
    isEditing: boolean,
    onUpdate: (field: string, val: string[]) => void
}) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (project.images.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % project.images.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [project.images.length]);

    return (
        <div className="flex flex-col items-center max-w-4xl mx-auto text-center">
            <div className="relative overflow-hidden shadow-sm">
                <img
                    key={currentImageIndex}
                    src={project.images[currentImageIndex]}
                    alt=""
                    className="h-[460px] md:h-[613px] w-auto object-contain"
                />
            </div>

            {/* Editing: Image Management for Home (Same logic as Gallery) */}
            {isEditing && (
                <div className="mt-8 w-full max-w-2xl px-4">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-4">Manage Home Slideshow</h4>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {project.images.map((img, idx) => (
                            <div key={idx} className="relative group aspect-[3/4] bg-gray-50 border border-gray-200">
                                <img src={img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                    {idx > 0 && (
                                        <button
                                            onClick={() => {
                                                const newImgs = [...project.images];
                                                [newImgs[idx - 1], newImgs[idx]] = [newImgs[idx], newImgs[idx - 1]];
                                                onUpdate('images', newImgs);
                                            }}
                                            className="bg-white text-black p-1 text-[10px]"
                                        >
                                            ←
                                        </button>
                                    )}
                                    {idx < project.images.length - 1 && (
                                        <button
                                            onClick={() => {
                                                const newImgs = [...project.images];
                                                [newImgs[idx + 1], newImgs[idx]] = [newImgs[idx], newImgs[idx + 1]];
                                                onUpdate('images', newImgs);
                                            }}
                                            className="bg-white text-black p-1 text-[10px]"
                                        >
                                            →
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            const newImgs = project.images.filter((_, i) => i !== idx);
                                            onUpdate('images', newImgs);
                                        }}
                                        className="bg-red-500 text-white p-1 text-[10px]"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                        <label className="aspect-[3/4] border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                                type="file"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('projectId', project.id);
                                    try {
                                        const res = await fetch('/api/upload', {
                                            method: 'POST',
                                            body: formData
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            onUpdate('images', [...project.images, data.path]);
                                        }
                                    } catch (err) {
                                        console.error('Upload failed', err);
                                    }
                                }}
                            />
                            <span className="text-xl text-gray-400">+</span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}

function AboutContent({
    data,
    isEditing,
    onUpdateAbout,
    onUpdatePub,
    onUpdateShow
}: {
    data: ContentData['about'],
    isEditing: boolean,
    onUpdateAbout: (section: keyof ContentData['about'], field: string, value: string) => void,
    onUpdatePub: (index: number, field: string, value: string) => void,
    onUpdateShow: (index: number, field: string, value: string) => void
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl w-full px-4">

            {/* Image Side */}
            <div className="flex items-center justify-center">
                <div className="relative w-[250px] aspect-square rounded-full overflow-hidden bg-gray-200 grayscale contrast-125">
                    {/* Placeholder for Headshot */}
                </div>
            </div>

            {/* Text Side */}
            <div className="space-y-8 text-sm md:text-sm leading-relaxed">
                <div className="font-medium">
                    <p>Isaiah Thomas</p>
                    {/* Could make this editable if it differs from siteTitle, but assuming same for now */}
                </div>

                {/* Contact */}
                <div>
                    <p className="underline underline-offset-4 decoration-black mb-2">Contact</p>
                    {isEditing ? (
                        <div className="flex flex-col gap-2">
                            <input className="border-b border-gray-300 outline-none" value={data.contact.email} onChange={(e) => onUpdateAbout('contact', 'email', e.target.value)} />
                            <input className="border-b border-gray-300 outline-none" value={data.contact.instagram} onChange={(e) => onUpdateAbout('contact', 'instagram', e.target.value)} />
                        </div>
                    ) : (
                        <>
                            <p className="italic">{data.contact.email}</p>
                            <p className="italic">{data.contact.instagram}</p>
                        </>
                    )}
                </div>

                {/* Bio */}
                <div>
                    <p className="underline underline-offset-4 decoration-black mb-2">Bio</p>
                    {isEditing ? (
                        <textarea
                            className="w-full h-40 border border-gray-300 p-2 outline-none text-sm"
                            value={data.bio.text}
                            onChange={(e) => onUpdateAbout('bio', 'text', e.target.value)}
                        />
                    ) : (
                        <p>{data.bio.text}</p>
                    )}

                    <div className="mt-4">
                        {isEditing ? (
                            <textarea
                                className="w-full h-16 border border-gray-300 p-2 outline-none text-sm"
                                value={data.bio.locations}
                                onChange={(e) => onUpdateAbout('bio', 'locations', e.target.value)}
                            />
                        ) : (
                            <p dangerouslySetInnerHTML={{ __html: data.bio.locations.replace(/\n/g, '<br/>') }} />
                        )}
                    </div>
                </div>

                {/* Education */}
                <div>
                    <p className="underline underline-offset-4 decoration-black mb-2">Education</p>
                    {isEditing ? (
                        <div className="flex flex-col gap-2">
                            <input className="border-b border-gray-300 outline-none" value={data.education.degrees} onChange={(e) => onUpdateAbout('education', 'degrees', e.target.value)} />
                            <input className="border-b border-gray-300 outline-none" value={data.education.school} onChange={(e) => onUpdateAbout('education', 'school', e.target.value)} />
                            <input className="border-b border-gray-300 outline-none" value={data.education.year} onChange={(e) => onUpdateAbout('education', 'year', e.target.value)} />
                        </div>
                    ) : (
                        <>
                            <p>{data.education.degrees}</p>
                            <p>{data.education.school}</p>
                            <p>{data.education.year}</p>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-8">
                    {/* Publications */}
                    <div>
                        <p className="font-medium mb-2">Publications</p>
                        <div className="space-y-4 text-xs">
                            {data.publications.map((pub, i) => (
                                <div key={i} className={isEditing ? 'border-l-2 border-gray-200 pl-2' : ''}>
                                    {isEditing ? (
                                        <div className="flex flex-col gap-1">
                                            <input placeholder="Title" className="border-b outline-none" value={pub.title} onChange={(e) => onUpdatePub(i, 'title', e.target.value)} />
                                            <input placeholder="Publisher" className="border-b outline-none" value={pub.publisher} onChange={(e) => onUpdatePub(i, 'publisher', e.target.value)} />
                                            <input placeholder="Volume" className="border-b outline-none" value={pub.volume} onChange={(e) => onUpdatePub(i, 'volume', e.target.value)} />
                                            <input placeholder="Year" className="border-b outline-none" value={pub.year} onChange={(e) => onUpdatePub(i, 'year', e.target.value)} />
                                        </div>
                                    ) : (
                                        <>
                                            <p className="italic">{pub.title}</p>
                                            <p>{pub.publisher}</p>
                                            <p>{pub.volume}</p>
                                            <p>{pub.year}</p>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shows */}
                    <div>
                        <p className="font-medium mb-2">Shows</p>
                        <div className="space-y-4 text-xs">
                            {data.shows.map((show, i) => (
                                <div key={i} className={isEditing ? 'border-l-2 border-gray-200 pl-2' : ''}>
                                    {isEditing ? (
                                        <div className="flex flex-col gap-1">
                                            <input placeholder="Title" className="border-b outline-none" value={show.title} onChange={(e) => onUpdateShow(i, 'title', e.target.value)} />
                                            <input placeholder="Location" className="border-b outline-none" value={show.location} onChange={(e) => onUpdateShow(i, 'location', e.target.value)} />
                                            <input placeholder="Year" className="border-b outline-none" value={show.year} onChange={(e) => onUpdateShow(i, 'year', e.target.value)} />
                                        </div>
                                    ) : (
                                        <>
                                            <p>{show.title}</p>
                                            <p>{show.location}</p>
                                            <p>{show.year}</p>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
