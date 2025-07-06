"use client";
import React, { useState, useEffect } from "react";
import { RuleCard } from '@/components/admin/RuleCard';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListFilter, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Rule = {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  category: 'Typing' | 'Device' | 'Location' | 'Transaction' | 'Other';
  severityImpact: number;
  isEnabled: boolean;
  isMock?: boolean;
};

const ruleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(5, "Rule name must be at least 5 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  condition: z.string().min(5, "Condition must be at least 5 characters."),
  action: z.string().min(5, "Action must be at least 5 characters."),
  category: z.enum(['Typing', 'Device', 'Location', 'Transaction', 'Other']),
  severityImpact: z.coerce.number().min(0).max(100, "Severity impact must be between 0 and 100."),
  isEnabled: z.boolean(),
  isMock: z.boolean().optional(),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

export default function AdminRulesPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [filterCategory, setFilterCategory] = useState<Rule['category'] | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all');

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: "", description: "", condition: "", action: "",
      category: "Other", severityImpact: 10, isEnabled: true,
    },
  });

  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem('token') : null);

  const onRuleFormSubmit = async (values: RuleFormValues) => {
    const token = getToken();
    if (!token) {
      toast({ title: "Not authenticated", variant: "destructive" });
      return;
    }

    const payload = {
      ...values,
      severityImpact: Number(values.severityImpact),
    };

    try {
      let res;
      if (editingRule) {
        res = await fetch(`${API_URL}/rules/${editingRule.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_URL}/rules`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        let errorMsg = 'Failed to save rule.';
        try {
          const errorData = await res.json();
          errorMsg = errorData.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      toast({ title: editingRule ? 'Rule updated successfully!' : 'Rule created successfully!' });
      setIsRuleDialogOpen(false);
      form.reset();
      setEditingRule(null);
      fetchRules();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : "Could not save rule.",
        variant: 'destructive',
      });
    }
  };

  const resetAndOpenDialog = (rule?: Rule) => {
    if (rule) {
      setEditingRule(rule);
      form.reset({
        ...rule,
        severityImpact: Number(rule.severityImpact) || 0,
        isEnabled: rule.isEnabled ?? true,
      });
    } else {
      setEditingRule(null);
      form.reset({
        name: "", description: "", condition: "", action: "",
        category: "Other", severityImpact: 10, isEnabled: true,
      });
    }
    setIsRuleDialogOpen(true);
  };

  const fetchRules = async () => {
    const token = getToken();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/rules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const realData: Rule[] = response.ok ? await response.json() : [];
      setRules(realData);
    } catch (error) {
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleRule = async (ruleId: string, isEnabled: boolean) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isEnabled })
      });
      if (!res.ok) throw new Error('Failed to toggle rule.');
      fetchRules();
      toast({ title: `Rule ${isEnabled ? 'Enabled' : 'Disabled'}` });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : 'Update failed.', variant: "destructive" });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/rules/${ruleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed.');
      fetchRules();
      toast({ title: "Rule Deleted", variant: "destructive" });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : 'Delete failed.', variant: "destructive" });
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesCategory = filterCategory === 'all' || rule.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'enabled' && rule.isEnabled) || (filterStatus === 'disabled' && !rule.isEnabled);
    return matchesCategory && matchesStatus;
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
        </div>
      );
    }
    if (filteredRules.length > 0) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggleRule={handleToggleRule}
              onEditRule={resetAndOpenDialog}
              onDeleteRule={handleDeleteRule}
            />
          ))}
        </div>
      );
    }
    return <p className="text-center py-10 text-muted-foreground">No rules match the current filters.</p>;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Fraud Detection Rules</h1>
        <Button onClick={() => resetAndOpenDialog()} className="shadow-md">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Rule
        </Button>
      </div>

      <Card className="p-4 md:p-6 shadow-lg rounded-lg border">
        <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
          <h3 className="font-headline text-xl font-semibold flex items-center">
            <ListFilter className="mr-2 h-5 w-5 text-primary" /> Current Rules ({filteredRules.length})
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto md:ml-auto">
            <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as Rule['category'] | 'all')}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by category..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {(['Typing', 'Device', 'Location', 'Transaction', 'Other'] as Rule['category'][]).map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'enabled' | 'disabled')}>
              <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Filter by status..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {renderContent()}
      </Card>

      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-lg">
          <DialogHeader className="pt-2">
            <DialogTitle className="font-headline text-2xl">{editingRule ? 'Edit Rule' : 'Add New Rule'}</DialogTitle>
            <DialogDescription>
              {editingRule ? `Modify the details for rule: ${editingRule.name}` : 'Define a new fraud detection rule for the system.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onRuleFormSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-3">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Rule Name</FormLabel><FormControl><Input placeholder="e.g., High Value First Transaction" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Detailed explanation of the rule's purpose and logic" {...field} rows={3} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="condition" render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition (Logic)</FormLabel>
                  <FormControl><Input placeholder="e.g., transaction.amount > 1000 && user.is_new" {...field} /></FormControl>
                  <FormDescription>
                    Use <code>expr-eval</code> syntax. Supported operators: <code>+ - * / % ^ == != &gt; &gt;= &lt; &lt;= and or not</code>.
                    Avoid <code>count()</code> or time-windowed conditions like <code>within 1 hour</code>.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="action" render={({ field }) => (
                <FormItem><FormLabel>Action</FormLabel><FormControl><Input placeholder="e.g., create_alert(Suspicious Login); update_trust_score(-0.1);" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {(['Typing', 'Device', 'Location', 'Transaction', 'Other'] as Rule['category'][]).map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="severityImpact" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity Impact (0-100)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ""}
                        onChange={e => field.onChange(Number(e.target.value))}
                        min={0}
                        max={100}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="isEnabled" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/40 mt-1">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Rule</FormLabel>
                    <FormDescription>Determines if this rule is active in the system.</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <DialogFooter className="pt-6">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">{form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : (editingRule ? 'Save Changes' : 'Create Rule')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}