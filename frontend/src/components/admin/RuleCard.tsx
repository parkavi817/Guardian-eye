
"use client";
import type { Rule } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

interface RuleCardProps {
  rule: Rule;
  onToggleRule: (ruleId: string, isEnabled: boolean) => void;
  onEditRule: (rule: Rule) => void;
  onDeleteRule: (ruleId: string) => void;
}

export function RuleCard({ rule, onToggleRule, onEditRule, onDeleteRule }: RuleCardProps) {
  return (
    <Card className="shadow-lg rounded-lg hover:shadow-primary/10 transition-shadow border flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-2">
            <div className="flex-grow">
                <CardTitle className="font-headline text-lg">{rule.name}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">ID: {rule.id}</CardDescription>
            </div>
            <Badge 
              variant={rule.isEnabled ? "default" : "outline"} 
              className={cn(
                "whitespace-nowrap text-xs py-1 px-2.5",
                rule.isEnabled ? "bg-green-600/90 border-green-600 text-white" : "border-gray-400 text-gray-500 dark:text-gray-400"
              )}
            >
                {rule.isEnabled ? <CheckCircle className="mr-1.5 h-3.5 w-3.5"/> : <XCircle className="mr-1.5 h-3.5 w-3.5"/>}
                {rule.isEnabled ? "Active" : "Inactive"}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow">
        <p className="text-sm text-muted-foreground leading-relaxed"><span className="font-semibold text-foreground">Description:</span> {rule.description}</p>
        <p className="text-sm font-mono bg-muted p-3 rounded-md text-xs leading-normal break-words"><span className="font-semibold font-sans text-muted-foreground">Condition:</span> {rule.condition}</p>
        <p className="text-sm"><span className="font-semibold">Action:</span> {rule.action}</p>
        <div className="flex items-center justify-between text-sm pt-1">
            <span className="font-semibold">Category:</span> <Badge variant="secondary">{rule.category}</Badge>
            <span className="font-semibold">Impact:</span> <Badge variant="outline" className="font-medium">{rule.severityImpact} pts</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4 mt-auto">
        <div className="flex items-center space-x-2">
          <Switch
            id={`rule-toggle-${rule.id}`}
            checked={rule.isEnabled}
            onCheckedChange={(checked) => onToggleRule(rule.id, checked)}
            aria-label={rule.isEnabled ? "Deactivate rule" : "Activate rule"}
          />
          <Label htmlFor={`rule-toggle-${rule.id}`} className="text-sm cursor-pointer select-none">
            {rule.isEnabled ? "Enabled" : "Disabled"}
          </Label>
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => onEditRule(rule)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDeleteRule(rule.id)}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
