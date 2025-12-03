'use client'

import { useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import type { JSONContent } from '@tiptap/core'
import { EditorToolbar } from './editor-toolbar'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface NovelEditorProps {
  initialContent?: JSONContent
  onChange?: (content: JSONContent) => void
}

export function NovelEditor({ initialContent, onChange }: NovelEditorProps) {
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `articles/${fileName}`

      const { error } = await supabase.storage
        .from('article-images')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error(error)
      toast.error('画像のアップロードに失敗しました')
      return null
    } finally {
      setIsUploading(false)
    }
  }, [supabase])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4',
        },
      }),
      Placeholder.configure({
        placeholder: '本文を入力...',
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0]
          if (file.type.startsWith('image/')) {
            event.preventDefault()
            uploadImage(file).then((url) => {
              if (url) {
                const { tr } = view.state
                const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
                if (pos) {
                  const node = view.state.schema.nodes.image.create({ src: url })
                  const transaction = tr.insert(pos.pos, node)
                  view.dispatch(transaction)
                }
              }
            })
            return true
          }
        }
        return false
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (items) {
          for (const item of items) {
            if (item.type.startsWith('image/')) {
              event.preventDefault()
              const file = item.getAsFile()
              if (file) {
                uploadImage(file).then((url) => {
                  if (url) {
                    const { tr, selection } = view.state
                    const node = view.state.schema.nodes.image.create({ src: url })
                    const transaction = tr.insert(selection.from, node)
                    view.dispatch(transaction)
                  }
                })
              }
              return true
            }
          }
        }
        return false
      },
    },
  })

  return (
    <div className="border rounded-lg overflow-hidden">
      {editor && <EditorToolbar editor={editor} onImageUpload={uploadImage} isUploading={isUploading} />}
      <EditorContent editor={editor} />
    </div>
  )
}
