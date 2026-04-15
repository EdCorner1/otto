import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServerSupabaseClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, cover_image_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) return { title: 'Post Not Found' }

  const url = `https://www.ottougc.com/blog/${slug}`
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      url,
      type: 'article',
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.cover_image_url ? [post.cover_image_url] : [],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const BlogPostClient = (await import('./BlogPostClient')).default
  return <BlogPostClient slug={slug} />
}

export const dynamic = 'force-dynamic'
