'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export type LinkedStudent = {
  id: string;
  name: string;
  email: string;
};

type ParentContextType = {
  linkedStudents: LinkedStudent[];
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string) => void;
};

const ParentContext = createContext<ParentContextType | undefined>(undefined);

export function ParentProvider({ 
  children, 
  linkedStudents 
}: { 
  children: ReactNode;
  linkedStudents: LinkedStudent[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Try to get selected student from URL or localStorage, default to first student
  const [selectedStudentId, setSelectedStudentIdState] = useState<string | null>(() => {
    const fromUrl = searchParams?.get('student');
    if (fromUrl && linkedStudents.find(s => s.id === fromUrl)) return fromUrl;
    
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('parentSelectedStudentId');
      if (stored && linkedStudents.find(s => s.id === stored)) return stored;
    }
    
    return linkedStudents.length > 0 ? linkedStudents[0].id : null;
  });

  const setSelectedStudentId = (id: string) => {
    setSelectedStudentIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('parentSelectedStudentId', id);
    }
    
    // Update URL without a full reload
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('student', id);
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    // If current selected student isn't in URL, add it
    const fromUrl = searchParams?.get('student');
    if (selectedStudentId && fromUrl !== selectedStudentId) {
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('student', selectedStudentId);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [selectedStudentId, searchParams, pathname, router]);

  return (
    <ParentContext.Provider value={{ linkedStudents, selectedStudentId, setSelectedStudentId }}>
      {children}
    </ParentContext.Provider>
  );
}

export function useParentContext() {
  const context = useContext(ParentContext);
  if (context === undefined) {
    throw new Error('useParentContext must be used within a ParentProvider');
  }
  return context;
}
