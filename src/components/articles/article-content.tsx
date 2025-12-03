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
      className="article-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
