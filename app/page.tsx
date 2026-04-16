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
    const [activeSection, setActiveSection] = useState<string>('');
    const [lightbox, setLightbox] = useState<{images: string[], index: number, title?: string, meta?: string} | null>(null);

    const nextLightboxImage = () => {
        if (!lightbox) return;
        setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.images.length });
    };

    const prevLightboxImage = () => {
        if (!lightbox) return;
        setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length });
    };

    // --- Effects ---
    useEffect(() => {
        fetchContent();
    }, []);

    useEffect(() => {
        if (!content) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, { threshold: 0.3 });

        const sections = document.querySelectorAll('section');
        sections.forEach((section) => observer.observe(section));

        return () => {
            sections.forEach((section) => observer.unobserve(section));
        };
    }, [content]);

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

            {/* Top White Bar */}
            <div className="fixed top-0 left-0 w-full h-[60px] bg-white z-40"></div>

            {/* 1. Fixed Name (Left) */}
            <div className="fixed top-5 left-5 md:top-6 md:left-6 z-50">
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
            <div className="flex flex-col items-center w-full pt-[60px] pb-[60px]">
                {content.projects.map((project, index) => (
                    <section key={project.id} id={project.id} className="pt-2 md:pt-6 pb-20 border-b border-black w-full flex flex-col items-center">
                        <ProjectGrid
                            project={project}
                            isEditing={isEditing}
                            onUpdate={(field, val) => updateProject(index, field, val as any)}
                            onOpenLightbox={(images, idx, title, meta) => setLightbox({ images, index: idx, title, meta })}
                        />
                    </section>
                ))}

                {/* About Section */}
                <section id="about" className="py-8 md:py-16 flex items-center justify-center w-full bg-white">
                    <AboutContent
                        data={content.about}
                        isEditing={isEditing}
                        onUpdateAbout={updateAbout}
                        onUpdatePub={updatePublication}
                        onUpdateShow={updateShow}
                    />
                </section>
            </div>

            {/* 3. Bottom Marquee Ticker */}
            <div className="fixed bottom-0 left-0 w-full h-[40px] md:h-[60px] bg-white z-50 flex items-center overflow-hidden">
                <div className="animate-marquee flex items-center text-black text-[9px] md:text-[11px] tracking-widest font-medium uppercase min-w-max">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="flex flex-row items-center whitespace-nowrap">
                            {content.projects.filter(p => !p.isHome).map((p, idx) => (
                                <div key={`${p.id}-${i}-${idx}`} className="flex flex-row items-center">
                                    <button 
                                        onClick={() => scrollToSection(p.id)} 
                                        className={`hover:opacity-70 transition-all ${activeSection === p.id ? 'underline underline-offset-4' : ''}`}
                                    >
                                        {p.title}
                                    </button>
                                    <span className="mx-4 md:mx-6 opacity-50">—</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. About & Substack (Top Right) */}
            <div className="fixed top-5 right-5 md:top-6 md:right-6 flex flex-row gap-6 items-center z-50 text-[9px] md:text-xs font-medium tracking-tight">
                <button onClick={() => scrollToSection('about')} className="hover:opacity-70 transition-opacity">
                    About
                </button>
                <a href="https://sonsuburban.substack.com/" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                    Substack
                </a>
            </div>

            {/* 5. Lightbox Modal */}
            {lightbox && (
                <div 
                    className="fixed inset-0 pt-[60px] pb-[60px] bg-white z-30 flex flex-col items-center justify-center p-8"
                >
                    <button 
                        onClick={() => setLightbox(null)} 
                        className="absolute top-[80px] right-8 md:right-12 text-xl md:text-2xl font-light hover:opacity-50 text-black cursor-pointer z-40"
                    >
                        ✕
                    </button>

                    {lightbox.images.length > 1 && (
                        <>
                            <button onClick={prevLightboxImage} className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 text-2xl md:text-6xl font-light hover:opacity-50 text-black z-40 p-4">‹</button>
                            <button onClick={nextLightboxImage} className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 text-2xl md:text-6xl font-light hover:opacity-50 text-black z-40 p-4">›</button>
                        </>
                    )}

                    <div className="relative w-full max-w-[90vw] h-full max-h-[75vh] flex items-center justify-center mb-4">
                        <img 
                            src={lightbox.images[lightbox.index]} 
                            className="max-h-full max-w-full object-contain" 
                            alt="Enlarged art piece"
                        />
                    </div>
                    {(lightbox.title || lightbox.meta) && (
                        <div className="text-center font-medium flex flex-col gap-1 text-[8px] md:text-[10px] tracking-widest uppercase text-black mt-2">
                            {lightbox.title && <span>{lightbox.title}</span>}
                            {lightbox.meta && <span className="opacity-70 normal-case">{lightbox.meta}</span>}
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}

// --- Subcomponents ---

function ProjectGrid({
    project,
    isEditing,
    onUpdate,
    onOpenLightbox
}: {
    project: ContentData['projects'][0],
    isEditing: boolean,
    onUpdate: (field: string, val: any) => void,
    onOpenLightbox: (images: string[], index: number, title?: string, meta?: string) => void
}) {
    return (
        <div className="flex flex-col items-center w-full px-4 md:px-8 lg:px-12">
            
            {/* Editing: Top Controls for Title/Meta */}
            {isEditing && (
                <div className="mb-8 w-full max-w-2xl px-4 flex flex-col gap-2 items-center bg-gray-50 border border-gray-200 p-4">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-2">Edit Details</h4>
                    <input
                        className="text-center border-b border-gray-300 outline-none w-full max-w-[300px] text-xs bg-transparent"
                        value={project.title}
                        onChange={(e) => onUpdate('title', e.target.value)}
                        placeholder="Project Title"
                    />
                    <textarea
                        className="text-center border border-gray-300 outline-none w-full max-w-[300px] text-[10px] min-h-[40px] bg-transparent"
                        value={project.meta || ''}
                        onChange={(e) => onUpdate('meta', e.target.value)}
                        placeholder="Meta info..."
                    />
                    <input
                        className="text-center border-b border-gray-300 outline-none w-16 text-xs bg-transparent"
                        value={project.year || ''}
                        onChange={(e) => onUpdate('year', e.target.value)}
                        placeholder="Year"
                    />
                </div>
            )}

            {/* Flex Row Layout */}
            <div className="flex flex-row flex-wrap justify-start content-center gap-x-12 md:gap-x-20 lg:gap-x-24 gap-y-4 md:gap-y-6 w-full px-0 sm:px-4">
                {project.images.map((img, idx) => (
                    <div key={idx} className="h-[120px] sm:h-[180px] lg:h-[240px] flex items-center justify-center relative group">
                        <img 
                            src={img} 
                            alt={`${project.title} ${idx + 1}`} 
                            className={`h-full w-auto object-contain transform transition-all ${!isEditing ? 'cursor-pointer hover:opacity-80' : ''}`}
                            onClick={() => !isEditing && onOpenLightbox(project.images, idx, project.title, project.meta)}
                        />
                        {/* Editing Inline Image Controls */}
                        {isEditing && (
                            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex gap-1">
                                    {idx > 0 && (
                                        <button onClick={() => {
                                            const newImgs = [...project.images];
                                            [newImgs[idx - 1], newImgs[idx]] = [newImgs[idx], newImgs[idx - 1]];
                                            onUpdate('images', newImgs as any);
                                        }} className="bg-white text-black p-1 text-[10px] shadow-sm">↑</button>
                                    )}
                                    {idx < project.images.length - 1 && (
                                        <button onClick={() => {
                                            const newImgs = [...project.images];
                                            [newImgs[idx + 1], newImgs[idx]] = [newImgs[idx], newImgs[idx + 1]];
                                            onUpdate('images', newImgs as any);
                                        }} className="bg-white text-black p-1 text-[10px] shadow-sm">↓</button>
                                    )}
                                    <button onClick={() => {
                                        const newImgs = project.images.filter((_, i) => i !== idx);
                                        onUpdate('images', newImgs as any);
                                    }} className="bg-red-500 text-white p-1 text-[10px] shadow-sm">×</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Upload Image Button Placeholder inside flex layout */}
                {isEditing && (
                    <label className="w-[120px] md:w-[150px] lg:w-[180px] h-[120px] sm:h-[180px] lg:h-[240px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
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
                        <span className="text-[10px] text-gray-400 mt-2">Add Image</span>
                    </label>
                )}
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl w-full px-4 items-center">

            {/* Image Side */}
            <div className="flex items-center justify-center">
                <div className="relative w-[300px] md:w-[400px] h-auto overflow-hidden">
                    <img src="/images/about/Scan_new.jpg" alt="Isaiah Thomas" className="w-full h-auto object-contain" />
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
