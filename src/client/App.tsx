import { useDispatch, useSelector } from 'react-redux';
import { type RootState, type AppDispatch } from './redux/store';
import { useEffect, lazy, Suspense } from 'react';
import { initPreferences } from './redux/preferences-actions';
import { ErrorPage } from './ui/components/error-page';
import { LoadingSpinner } from './ui/components/loading-spinner';
import { LoadingFallback } from './ui/components/loading-fallback';
import { ScrollToTop } from './ui/components/scroll-to-top';
import { CmsProvider } from './context/cms-context';
import { ROUTES } from './utilities/constants';
import { Routes, Route, BrowserRouter, Navigate } from 'react-router';

const Home = lazy(() => import('./pages/Home'));
const StudyDestinations = lazy(() => import('./pages/StudyDestinations'));
const StudyDestinationDetail = lazy(() => import('./pages/StudyDestinationDetail'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const RecruitmentPage = lazy(() => import('./pages/RecruitmentPage'));
const RoleDetail = lazy(() => import('./pages/RoleDetail'));
const About = lazy(() => import('./pages/About'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const Policies = lazy(() => import('./pages/Policies'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const App = () => {
  const { loading, error } = useSelector((state: RootState) => state.preferences);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(initPreferences());
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorPage message={error} />;

  return (
    <CmsProvider>
      <Suspense fallback={<LoadingFallback />}>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path={ROUTES.HOME} element={<Home />} />

            <Route path={ROUTES.STUDY} element={<StudyDestinations />} />
            <Route path={ROUTES.STUDY_DETAIL} element={<StudyDestinationDetail />} />

            <Route path={ROUTES.COURSES} element={<CoursesPage />} />
            <Route path={ROUTES.COURSE_DETAIL} element={<CourseDetail />} />

            <Route path={ROUTES.SERVICES} element={<ServicesPage />} />

            <Route path={ROUTES.RECRUITMENT} element={<RecruitmentPage />} />
            <Route path={ROUTES.RECRUITMENT_DETAIL} element={<RoleDetail />} />

            <Route path={ROUTES.ABOUT} element={<About />} />

            <Route path={ROUTES.BLOG} element={<BlogPage />} />
            <Route path={ROUTES.BLOG_DETAIL} element={<PostDetail />} />

            <Route path={ROUTES.CONTACT} element={<ContactPage />} />
            <Route path={ROUTES.POLICIES} element={<Policies />} />

            <Route path={ROUTES.ADMIN} element={<AdminDashboard />} />
            <Route path={ROUTES.LOGIN} element={<Navigate to={ROUTES.ADMIN} replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </Suspense>
    </CmsProvider>
  );
};

export default App;
