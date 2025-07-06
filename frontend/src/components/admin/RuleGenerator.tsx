"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  generateFraudDetectionRules,
  type GenerateFraudDetectionRulesInput,
  type GenerateFraudDetectionRulesOutput,
} from "@/ai/flows/generate-fraud-detection-rules";
import { Wand2, Loader2, Check, Trash2 } from "lucide-react";

const ruleGeneratorSchema = z.object({
  historicalDataSummary: z
    .string()
    .min(50, { message: "Please provide a more detailed summary (min 50 characters)." }),
  currentRules: z
    .string()
    .min(20, { message: "Please list some current rules (min 20 characters)." }),
});

type RuleGeneratorFormValues = z.infer<typeof ruleGeneratorSchema>;

export function RuleGenerator() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedRules, setSuggestedRules] = useState<GenerateFraudDetectionRulesOutput | null>(null);
  const [addingRuleIndex, setAddingRuleIndex] = useState<number | null>(null);

  const form = useForm<RuleGeneratorFormValues>({
    resolver: zodResolver(ruleGeneratorSchema),
    defaultValues: {
      historicalDataSummary:
        "Example: Recent increase in transactions from new accounts with high-value items. Some IPs are flagged as high-risk proxies. Average time to checkout for fraudulent transactions is very low (<10s).",
      currentRules:
        "Example: 1. If IP is on blacklist, risk_score += 50. 2. If transaction amount > $1000 and new account, risk_score += 20.",
    },
  });

  const onSubmit = async (data: RuleGeneratorFormValues) => {
    setIsLoading(true);
    setSuggestedRules(null);
    try {
      const input: GenerateFraudDetectionRulesInput = {
        historicalDataSummary: data.historicalDataSummary,
        currentRules: data.currentRules,
      };
      const result = await generateFraudDetectionRules(input);
      setSuggestedRules(result);
      toast({
        title: "Rule Suggestions Generated",
        description: "AI has provided new rule suggestions.",
      });
    } catch (error) {
      console.error("Error generating rules:", error);
      toast({
        title: "Error Generating Rules",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRule = async (rule: any, index: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Login required", variant: "destructive" });
      return;
    }

    setAddingRuleIndex(index);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...rule, isEnabled: true }),
      });
      if (!res.ok) throw new Error("Failed to add rule.");
      toast({ title: `Rule "${rule.name}" added successfully!`, icon: <Check /> });
    } catch (error) {
      toast({
        title: "Error Adding Rule",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setAddingRuleIndex(null);
    }
  };

  const handleClearRule = (index: number) => {
    if (!suggestedRules) return;
    const updated = [...suggestedRules.suggestedRules];
    updated.splice(index, 1);
    setSuggestedRules({ ...suggestedRules, suggestedRules: updated });
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <Wand2 className="mr-3 h-6 w-6 text-primary" />
          AI-Powered Rule Suggestion
        </CardTitle>
        <CardDescription>
          Provide a summary of historical data and current rules to get AI-generated suggestions for new fraud detection rules.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="historicalDataSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Historical Data Summary</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="Describe fraud patterns, user behavior, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentRules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Rules</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="List current rules (e.g., 'If IP is TOR node, risk += 30')." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Suggestions
                </>
              )}
            </Button>
          </form>
        </Form>

        {suggestedRules?.suggestedRules?.length > 0 && (
          <div className="mt-10 pt-6 border-t">
            <h3 className="font-headline text-xl font-semibold mb-4">Generated Rule Suggestions</h3>
            <div className="space-y-4">
              {suggestedRules.suggestedRules.map((rule, index) => (
                <Card key={index} className="bg-muted/30 border rounded-lg shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Description:</strong> {rule.description}</p>
                    <p><strong>Condition:</strong> <code>{rule.condition}</code></p>
                    <p><strong>Action:</strong> {rule.action}</p>
                    <p><strong>Category:</strong> {rule.category}</p>
                    <p><strong>Severity Impact:</strong> {rule.severityImpact}</p>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        size="sm"
                        disabled={addingRuleIndex === index}
                        onClick={() => handleAddRule(rule, index)}
                      >
                        {addingRuleIndex === index ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Add
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleClearRule(index)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="pt-6">
                <h4 className="font-semibold mb-1">AI Explanation</h4>
                <Textarea
                  value={suggestedRules.explanation}
                  readOnly
                  rows={6}
                  className="bg-muted/50 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
