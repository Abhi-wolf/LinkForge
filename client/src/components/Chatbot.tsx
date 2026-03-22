import React, { useState, useRef, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from './ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { MessageSquare, Send, Bot, User, Loader2 } from 'lucide-react';
// import { chatWithGemini } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', parts: [{ text: input }] };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // History for Gemini SDK (role must be 'user' or 'model')
      const history = messages.map(msg => ({
        role: msg.role,
        parts: msg.parts
      }));

      // const response = await chatWithGemini(input, history);
      
      // const botMessage: Message = { 
      //   role: 'model', 
      //   parts: [{ text: response.text }] 
      // };
      
      // setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg border-primary/20 bg-background/80 backdrop-blur-sm hover:bg-primary/10 transition-all duration-300"
        >
          <MessageSquare className="h-6 w-6 text-primary" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col border-l border-primary/10">
        <SheetHeader className="p-4 border-b border-primary/10 bg-muted/30">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            LinkForge AI Assistant
          </SheetTitle>
        </SheetHeader>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-primary/10"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-50 px-4">
              <Bot className="h-12 w-12 mb-2" />
              <p className="text-sm font-medium">Hello! I'm your LinkForge AI.</p>
              <p className="text-xs">Ask me to create short URLs or get info about existing links!</p>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`max-w-[85%] p-3 text-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                  : 'bg-muted border-primary/10 rounded-tl-none'
              }`}>
                <div className="flex items-start gap-2">
                  {msg.role === 'model' && <Bot className="h-4 w-4 mt-0.5 shrink-0" />}
                  <span className="leading-relaxed whitespace-pre-wrap">{msg.parts[0].text}</span>
                  {msg.role === 'user' && <User className="h-4 w-4 mt-0.5 shrink-0" />}
                </div>
              </Card>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-muted border-primary/10 p-3 rounded-tl-none">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </Card>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-primary/10 bg-muted/30">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex gap-2"
          >
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-background border-primary/10 focus-visible:ring-primary/20"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};
