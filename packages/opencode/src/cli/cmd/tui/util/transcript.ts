import type { AssistantMessage, Part, UserMessage } from "@opencode-ai/sdk/v2"
import { Locale } from "@/util/locale"

export type TranscriptOptions = {
  thinking: boolean
  toolDetails: boolean
  assistantMetadata: boolean
}

export type SessionInfo = {
  id: string
  title: string
  time: {
    created: number
    updated: number
  }
}

export type MessageWithParts = {
  info: UserMessage | AssistantMessage
  parts: Part[]
}

export function formatTranscript(
  session: SessionInfo,
  messages: MessageWithParts[],
  options: TranscriptOptions,
): string {
  const lines = [
    `# ${session.title}`,
    "",
    `**Session ID:** ${session.id}`,
    `**Created:** ${new Date(session.time.created).toLocaleString()}`,
    `**Updated:** ${new Date(session.time.updated).toLocaleString()}`,
    "",
    "---",
    "",
  ]

  for (const msg of messages) {
    lines.push(formatMessage(msg.info, msg.parts, options), "---", "")
  }

  return lines.join("\n")
}

export function formatMessage(msg: UserMessage | AssistantMessage, parts: Part[], options: TranscriptOptions): string {
  const parts_ = [msg.role === "user" ? "## User" : formatAssistantHeader(msg, options.assistantMetadata)]

  for (const part of parts) {
    parts_.push(formatPart(part, options))
  }

  return parts_.join("")
}

export function formatAssistantHeader(msg: AssistantMessage, includeMetadata: boolean): string {
  if (!includeMetadata) {
    return `## Assistant\n\n`
  }

  const duration =
    msg.time.completed && msg.time.created ? ((msg.time.completed - msg.time.created) / 1000).toFixed(1) + "s" : ""

  return `## Assistant (${Locale.titlecase(msg.agent)} · ${msg.modelID}${duration ? ` · ${duration}` : ""})\n\n`
}

export function formatPart(part: Part, options: TranscriptOptions): string {
  if (part.type === "text" && !part.synthetic) {
    return `${part.text}\n\n`
  }

  if (part.type === "reasoning") {
    if (options.thinking) {
      return `_Thinking:_\n\n${part.text}\n\n`
    }
    return ""
  }

  if (part.type === "tool") {
    const lines = [`**Tool: ${part.tool}**`]
    if (options.toolDetails && part.state.input) {
      lines.push("", "**Input:**", "```json", JSON.stringify(part.state.input, null, 2), "```")
    }
    if (options.toolDetails && part.state.status === "completed" && part.state.output) {
      lines.push("", "**Output:**", "```", part.state.output, "```")
    }
    if (options.toolDetails && part.state.status === "error" && part.state.error) {
      lines.push("", "**Error:**", "```", part.state.error, "```")
    }
    lines.push("")
    return lines.join("\n")
  }

  return ""
}
