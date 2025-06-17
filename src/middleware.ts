import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface QuizProgress {
  status: 'not_started' | 'in_progress' | 'completed'
  current_step: number
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is not logged in, allow access to auth pages
  if (!session) {
    if (req.nextUrl.pathname.startsWith('/auth')) {
      return res;
    }
    // Redirect to login if trying to access protected routes
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // Check if user has completed profile setup
  const { data: profileProgress } = await supabase
    .from('user_quiz_progress')
    .select('status, current_step')
    .eq('user_id', session.user.id)
    .single() as { data: QuizProgress | null };

  // If profile setup not started, redirect to profile setup
  if (!profileProgress) {
    if (req.nextUrl.pathname.startsWith('/profile-setup')) {
      return res;
    }
    return NextResponse.redirect(new URL('/profile-setup', req.url));
  }

  // If profile setup in progress but not completed
  if (profileProgress.status === 'in_progress') {
    if (req.nextUrl.pathname.startsWith('/profile-setup') || req.nextUrl.pathname.startsWith('/quiz')) {
      return res;
    }
    return NextResponse.redirect(new URL('/profile-setup', req.url));
  }

  // If profile setup completed but quiz not started
  if (profileProgress.status === 'completed' && profileProgress.current_step === 1) {
    if (req.nextUrl.pathname.startsWith('/quiz')) {
      return res;
    }
    return NextResponse.redirect(new URL('/quiz/join-communities', req.url));
  }

  // If quiz in progress
  if (profileProgress.status === 'in_progress') {
    const quizSteps = [
      '/quiz/join-communities',
      '/quiz/anime-categories',
      '/quiz/find-anime',
      '/quiz/anime-database',
      '/quiz/last-quiz'
    ];
    
    const currentStep = quizSteps[profileProgress.current_step - 1];
    
    if (req.nextUrl.pathname.startsWith('/quiz')) {
      // Allow access to current step and previous steps
      const requestedStep = quizSteps.findIndex(step => req.nextUrl.pathname.startsWith(step));
      if (requestedStep <= profileProgress.current_step - 1) {
        return res;
      }
      return NextResponse.redirect(new URL(currentStep, req.url));
    }
    return NextResponse.redirect(new URL(currentStep, req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
