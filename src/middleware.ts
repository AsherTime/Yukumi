import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is not logged in, let them access the page
  if (!session) {
    return res;
  }

  // Check if user has completed the quiz
  const { data: quizProgress } = await supabase
    .from('user_quiz_progress')
    .select('status, current_step')
    .eq('user_id', session.user.id)
    .maybeSingle();

  // If no quiz progress exists, create one
  if (!quizProgress) {
    await supabase.from('user_quiz_progress').insert({
      user_id: session.user.id,
      status: 'not_started',
      current_step: 1
    });
  }

  // If quiz is not completed and user is not on a quiz page, redirect to quiz
  const isQuizPage = req.nextUrl.pathname.startsWith('/quiz');
  if (quizProgress?.status !== 'completed' && !isQuizPage) {
    return NextResponse.redirect(new URL('/quiz/join-communities', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|auth).*)',
  ],
};
