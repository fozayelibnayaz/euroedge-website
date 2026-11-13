import { Navigate, useParams } from 'react-router';
import { Link } from 'react-router';
import { useCms } from '@/client/context/cms-context';
import { PublicLayout } from '../ui/layout/public-layout';
import { PageMeta } from '../ui/components/page-meta';
import { Section } from '../ui/primitives/blocks';
import { Reveal, Parallax } from '../ui/primitives/motion';
import { SmartImage } from '../ui/primitives/media';
import { Badge, Card } from '../ui/primitives/ui';
import { PageHero } from '../ui/layout/page-hero';

const PostDetail = () => {
  const { slug } = useParams();
  const { cms } = useCms();
  const post = cms.posts.find((item) => item.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const related = cms.posts.filter((item) => item.id !== post.id).slice(0, 3);

  return (
    <PublicLayout>
      <PageMeta title={`${post.title} — EuroEdge Journal`} description={post.excerpt} image={post.coverImage} />

      <PageHero
        page={{
          id: `post-${post.id}`,
          slug: `/blog/${post.slug}`,
          title: post.title,
          heroEyebrow: `${post.category} · ${post.readTime}`,
          heroTitle: post.title,
          heroHighlight: '',
          heroSubtitle: post.excerpt,
          heroImage: post.coverImage,
          heroActions: [],
          showHero: true,
          blocks: [],
          navLabel: '',
          inNav: false,
          navOrder: 0,
          seoTitle: '',
          seoDescription: '',
          updatedAt: '',
        }}
        cms={cms}
      />

      <Section block={{ id: 'post-body', background: 'surface' }}>
        <Reveal>
          <div className="ee-row ee-row-md" style={{ flexWrap: 'wrap' }}>
            <Badge tone="accent">{post.category}</Badge>
            <span className="ee-faint" style={{ fontSize: '0.82rem' }}>
              {post.publishedAt}
            </span>
            <span className="ee-faint" style={{ fontSize: '0.82rem' }}>
              {post.author}
            </span>
            <span className="ee-faint" style={{ fontSize: '0.82rem' }}>
              {post.readTime}
            </span>
          </div>
        </Reveal>

        <div className="ee-stack ee-stack-md" style={{ marginTop: 28, maxWidth: '72ch' }}>
          {post.content.map((paragraph, index) => (
            <Reveal key={`p-${String(index)}`} delay={index * 50}>
              <p className="ee-body" style={{ fontSize: '1.02rem' }}>
                {paragraph}
              </p>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div
            className="ee-panel ee-row ee-row-between"
            style={{ marginTop: 40, gap: 18, flexWrap: 'wrap' }}
          >
            <div>
              <h3 className="ee-h4" style={{ margin: 0 }}>
                Want this applied to your own file?
              </h3>
              <p className="ee-body" style={{ margin: '6px 0 0' }}>
                Send your transcripts and we will tell you in writing where you stand.
              </p>
            </div>
            <Link to="/contact" className="ee-btn ee-btn-primary">
              Book a free assessment
            </Link>
          </div>
        </Reveal>
      </Section>

      {related.length > 0 ? (
        <Section block={{ id: 'post-related', background: 'muted' }}>
          <Reveal>
            <span className="ee-eyebrow">KEEP READING</span>
            <h2 className="ee-h2" style={{ marginTop: 10 }}>
              Related guides
            </h2>
          </Reveal>
          <div className="ee-grid ee-grid-3" style={{ marginTop: 26 }}>
            {related.map((item, index) => (
              <Reveal key={item.id} delay={index * 60}>
                <a href={`/blog/${item.slug}`} style={{ display: 'block', height: '100%' }}>
                  <Card hover className="ee-full ee-card-flush" style={{ height: '100%' }}>
                    <Parallax distance={10}>
                      <div className="ee-card-media" style={{ aspectRatio: '16 / 9' }}>
                        <SmartImage src={item.coverImage} alt={item.title} seed={item.id} />
                      </div>
                    </Parallax>
                    <div className="ee-stack ee-stack-xs" style={{ padding: 18 }}>
                      <Badge>{item.category}</Badge>
                      <h3 className="ee-h4">{item.title}</h3>
                      <p className="ee-body ee-clamp-2" style={{ fontSize: '0.88rem' }}>
                        {item.excerpt}
                      </p>
                    </div>
                  </Card>
                </a>
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}
    </PublicLayout>
  );
};

export default PostDetail;
