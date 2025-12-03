'use client'

import { useMemo } from 'react'
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Underline from '@tiptap/extension-underline'
import type { JSONContent } from '@tiptap/core'
import type { Json } from '@/types/database'

interface ArticleContentProps {
  content: JSONContent | Json
}

const extensions = [
  StarterKit,
  Link.configure({
    openOnClick: true,
    HTMLAttributes: {
      class: 'text-primary underline underline-offset-4',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  }),
  Image.configure({
    HTMLAttributes: {
      class: 'rounded-lg',
    },
  }),
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Highlight,
  TextStyle,
  Color,
  Underline,
]

export function ArticleContent({ content }: ArticleContentProps) {
  const html = useMemo(() => {
    if (!content || typeof content !== 'object' || Object.keys(content).length === 0) {
      return ''
    }
    try {
      return generateHTML(content as JSONContent, extensions)
    } catch (e) {
      console.error('Error generating HTML:', e)
      return ''
    }
  }, [content])

  return (
    <div
      className="article-content [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:mb-6 [&_h1]:mt-8 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:mb-4 [&_h2]:mt-8 [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:mb-3 [&_h3]:mt-6 [&_p]:mb-6 [&_p]:leading-[1.8] [&_ul]:mb-6 [&_ol]:mb-6 [&_li]:leading-[1.8]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
