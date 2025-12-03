import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { JSONContent } from '@tiptap/core'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// GPT-4o-miniの料金（2025年1月時点）
// Input: $0.150 / 1M tokens
// Output: $0.600 / 1M tokens
const PRICING = {
  'gpt-4o-mini': {
    input: 0.150 / 1_000_000,
    output: 0.600 / 1_000_000,
  },
}

// Markdown形式のテキストをTiptap JSONContentに変換
function parseMarkdownToTiptap(markdown: string): JSONContent {
  const lines = markdown.split('\n')
  const content: any[] = []

  let currentParagraph: string[] = []

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join('\n').trim()
      if (text) {
        content.push({
          type: 'paragraph',
          content: [{ type: 'text', text }],
        })
      }
      currentParagraph = []
    }
  }

  for (const line of lines) {
    const trimmedLine = line.trim()

    // 見出し（## テキスト）
    if (trimmedLine.startsWith('## ')) {
      flushParagraph()
      content.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: trimmedLine.slice(3) }],
      })
    }
    // 見出し（### テキスト）
    else if (trimmedLine.startsWith('### ')) {
      flushParagraph()
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: trimmedLine.slice(4) }],
      })
    }
    // 箇条書き（- テキスト）
    else if (trimmedLine.startsWith('- ')) {
      flushParagraph()
      if (content.length === 0 || content[content.length - 1].type !== 'bulletList') {
        content.push({
          type: 'bulletList',
          content: [],
        })
      }
      content[content.length - 1].content.push({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: trimmedLine.slice(2) }],
        }],
      })
    }
    // 番号付きリスト（1. テキスト）
    else if (/^\d+\.\s/.test(trimmedLine)) {
      flushParagraph()
      if (content.length === 0 || content[content.length - 1].type !== 'orderedList') {
        content.push({
          type: 'orderedList',
          content: [],
        })
      }
      content[content.length - 1].content.push({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: trimmedLine.replace(/^\d+\.\s/, '') }],
        }],
      })
    }
    // 空行
    else if (trimmedLine === '') {
      flushParagraph()
    }
    // 通常のテキスト
    else {
      currentParagraph.push(line)
    }
  }

  flushParagraph()

  return {
    type: 'doc',
    content: content.length > 0 ? content : [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: markdown }],
      },
    ],
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { title, prompt } = await request.json()

    if (!title || !prompt) {
      return NextResponse.json(
        { error: 'タイトルと伝えたいことを入力してください' },
        { status: 400 }
      )
    }

    // OpenAI APIで記事を生成
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `あなたはテクノロジー・ガジェット系Webメディアのライターです。
与えられたタイトルと要点を元に、約3000文字の記事を執筆してください。

記事の構成:
- 導入部分: 読者の興味を引く導入文（1-2段落）
- 本文: 複数のセクションに分けて、詳細に説明（見出しと段落で構成）
- まとめ: 記事の要点を簡潔にまとめる（1-2段落）

重要な書式ルール:
1. 見出しは「## 見出しテキスト」の形式で記述
2. 段落は空行で区切る
3. リストは「- 」または「1. 」で記述
4. 適度に段落を分けて読みやすくする（1段落は3-5文程度）

文体のポイント（重要）:
- 敬体（です・ます調）だが、堅苦しくない親しみやすさ
- 「〜ですね」「〜なんです」「〜なんですよ」などの柔らかい表現を適度に使用
- 読者に語りかけるような書き方（「気になりませんか？」「使ってみたくなりますよね」）
- 専門用語は使ってOKだが、わかりやすく噛み砕いて説明
- 具体例やたとえ話で分かりやすく
- 適度な驚きや興奮を表現（「なんと」「驚くべきことに」「実は」）
- 自然な会話調で、でも信頼性は保つ`,
        },
        {
          role: 'user',
          content: `以下の情報を元に記事を執筆してください。

タイトル: ${title}

伝えたいこと:
${prompt}

約3000文字で、読みやすい記事を作成してください。`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const generatedText = completion.choices[0]?.message?.content || ''

    // Markdown形式のテキストをTiptap JSONContentに変換
    const content = parseMarkdownToTiptap(generatedText)

    // 使用量を記録
    const usage = completion.usage
    if (usage) {
      const promptTokens = usage.prompt_tokens || 0
      const completionTokens = usage.completion_tokens || 0
      const totalTokens = usage.total_tokens || 0

      // 推定金額を計算
      const estimatedCost =
        (promptTokens * PRICING['gpt-4o-mini'].input) +
        (completionTokens * PRICING['gpt-4o-mini'].output)

      // データベースに記録
      const { error: insertError } = await (supabase as any).from('ai_usage').insert({
        user_id: user.id,
        model: 'gpt-4o-mini',
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        estimated_cost: estimatedCost,
        request_type: 'article_generation',
        metadata: {
          title,
          prompt_length: prompt.length,
        },
      })

      if (insertError) {
        console.error('Failed to insert ai_usage:', insertError)
        // エラーがあってもユーザーには成功レスポンスを返す（記事生成自体は成功しているため）
      } else {
        console.log('AI usage tracked successfully:', {
          promptTokens,
          completionTokens,
          totalTokens,
          estimatedCost,
        })
      }
    }

    // 抜粋を生成（最初の200文字、Markdown記号を除去）
    const excerpt = generatedText
      .replace(/^##\s+/gm, '')
      .replace(/^###\s+/gm, '')
      .replace(/^[-*]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .trim()
      .slice(0, 200)

    // SEO用のメタタイトルとメタディスクリプションを生成
    const metaTitle = title.length <= 60 ? title : title.slice(0, 57) + '...'
    const metaDescription = excerpt.length <= 160 ? excerpt : excerpt.slice(0, 157) + '...'

    return NextResponse.json({
      content,
      excerpt,
      metaTitle,
      metaDescription,
    })
  } catch (error) {
    console.error('OpenAI API Error:', error)
    return NextResponse.json(
      { error: '記事の生成に失敗しました' },
      { status: 500 }
    )
  }
}
