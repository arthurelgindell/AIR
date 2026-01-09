import { DIRECTORS, type Message as MessageType, type Speaker } from "../types";

interface MessageProps {
  message: MessageType;
}

function getSpeakerConfig(speaker: Speaker) {
  if (speaker === "chairman") {
    return {
      name: "Chairman",
      color: "#c9a962",
      borderClass: "message-chairman",
    };
  }
  if (speaker === "system") {
    return {
      name: "System",
      color: "#808080",
      borderClass: "",
    };
  }
  const director = DIRECTORS.find((d) => d.id === speaker);
  if (director) {
    return {
      name: director.name,
      color: director.color,
      borderClass: `message-${speaker}`,
    };
  }
  return {
    name: speaker,
    color: "#ffffff",
    borderClass: "",
  };
}

export function Message({ message }: MessageProps) {
  const config = getSpeakerConfig(message.speaker);
  const isChairman = message.speaker === "chairman";
  const isSystem = message.speaker === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 bg-board-tertiary/50 rounded-full text-sm text-text-muted italic">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl shadow-board ${config.borderClass} ${
        isChairman
          ? "ml-auto max-w-[70%]"
          : "mr-auto max-w-[70%]"
      }`}
    >
      {/* Message Card */}
      <div className="p-5">
        {/* Header - Name and Timestamp on separate lines */}
        <div className="mb-3">
          <div
            className="font-semibold text-base"
            style={{ color: config.color }}
          >
            {config.name}
          </div>
          <div className="text-xs text-text-muted mt-1">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </div>
        </div>

        {/* Content */}
        <div className="text-text-primary text-base leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </div>
  );
}

// Typing indicator component - Premium styled
interface TypingIndicatorProps {
  director: string;
}

export function TypingIndicator({ director }: TypingIndicatorProps) {
  const config = DIRECTORS.find((d) => d.id === director);
  const color = config?.color ?? "#ffffff";

  return (
    <div
      className="inline-flex items-center gap-3 px-5 py-3 bg-board-tertiary rounded-xl shadow-board border-l-4 max-w-[250px]"
      style={{ borderLeftColor: color }}
    >
      <span className="text-sm font-medium" style={{ color }}>
        {config?.name ?? director}
      </span>
      <div className="flex gap-1.5">
        <span
          className="typing-dot w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span
          className="typing-dot w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span
          className="typing-dot w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}
