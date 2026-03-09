interface TypingMessage {
  text: string;
  delay: number;
  batch: number;
}

self.onmessage = async (event: MessageEvent<TypingMessage>) => {
  const { text, delay, batch } = event.data;
  let buffer = "";

  for (const char of text) {
    buffer += char;

    if (buffer.length >= batch) {
      self.postMessage(buffer);
      buffer = "";
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // Send remaining buffer
  if (buffer.length > 0) {
    self.postMessage(buffer);
  }

  // Signal completion
  self.postMessage("__done__");
};