"use client";

import type { LeagueAiInsightDTO } from "@/lib/fpl/dto";
import { Card, Typography, Badge } from "./ui";
import { Sparkles, MessageCircle, TrendingUp, Ghost } from "lucide-react";

type LeagueAiInsightsProps = {
  insights: LeagueAiInsightDTO[];
};

export function LeagueAiInsights({ insights }: LeagueAiInsightsProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {insights.map((insight, index) => (
        <Card 
          key={index} 
          className="p-5 border-[color:var(--surface-border)] bg-gradient-to-br from-[color:var(--accent)]/5 to-transparent backdrop-blur-md animate-fade-in" 
          hover={true}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start gap-4">
            <div className={`p-2.5 rounded-xl shrink-0 ${getSentimentColor(insight.sentiment)}`}>
               {getSentimentIcon(insight.sentiment)}
            </div>
            <div className="min-w-0">
               <div className="flex items-center gap-2 mb-1">
                 <Typography variant="caption" weight="black" className="uppercase tracking-widest text-[9px] opacity-40">
                    Scout Report
                 </Typography>
                 {insight.squadName && (
                     <Badge variant="secondary" className="px-1.5 py-0.5 text-[8px] font-black uppercase truncate max-w-[100px]">
                        {insight.squadName}
                     </Badge>
                 )}
               </div>
               <Typography weight="black" className="text-xs text-[color:var(--text-primary)] leading-relaxed">
                  &quot;{insight.insight}&quot;
               </Typography>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function getSentimentColor(sentiment: LeagueAiInsightDTO["sentiment"]) {
  switch (sentiment) {
    case "positive": return "bg-cyan-500/10 text-cyan-400";
    case "negative": return "bg-red-500/10 text-red-400";
    case "funny": return "bg-purple-500/10 text-purple-400";
    default: return "bg-blue-500/10 text-blue-400";
  }
}

function getSentimentIcon(sentiment: LeagueAiInsightDTO["sentiment"]) {
  switch (sentiment) {
    case "positive": return <TrendingUp size={18} />;
    case "negative": return <Ghost size={18} />;
    case "funny": return <MessageCircle size={18} />;
    default: return <Sparkles size={18} />;
  }
}
