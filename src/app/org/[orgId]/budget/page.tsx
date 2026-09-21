import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui";
import { addBudgetLineAction, createBudgetAction, toggleBudgetLinePaidAction } from "@/lib/actions/budget";
import { format } from "date-fns";

export default async function BudgetPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireOrgMembership(orgId);

  const [memberships, budgets] = await Promise.all([
    db.membership.findMany({ where: { organizationId: orgId }, include: { user: true }, orderBy: { user: { name: "asc" } } }),
    db.seasonBudget.findMany({
      where: { organizationId: orgId },
      include: { user: true, lineItems: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Personal Season Budgets" subtitle="A clear breakdown of season costs for every family." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {budgets.length === 0 ? (
            <EmptyState title="No budgets yet" subtitle="Create a season budget for an athlete." />
          ) : (
            budgets.map((b) => {
              const spent = b.lineItems.reduce((sum, l) => sum + l.amount, 0);
              const paid = b.lineItems.filter((l) => l.paid).reduce((sum, l) => sum + l.amount, 0);
              return (
                <Card key={b.id}>
                  <CardHeader
                    title={`${b.user.name} — ${b.seasonName}`}
                    subtitle={`Budget: R${b.totalBudget.toFixed(2)} · Planned: R${spent.toFixed(2)} · Paid: R${paid.toFixed(2)}`}
                  />
                  <CardBody>
                    {b.lineItems.length === 0 ? (
                      <p className="text-sm text-slate-400">No line items yet.</p>
                    ) : (
                      <ul className="mb-3 divide-y divide-slate-100">
                        {b.lineItems.map((l) => (
                          <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                            <div>
                              <p className="font-medium text-slate-800">
                                {l.category} — R{l.amount.toFixed(2)}
                              </p>
                              <p className="text-xs text-slate-400">
                                {l.description} {l.dueDate ? `· due ${format(l.dueDate, "d MMM yyyy")}` : ""}
                              </p>
                            </div>
                            <form action={toggleBudgetLinePaidAction.bind(null, orgId, l.id, !l.paid)}>
                              <button type="submit">
                                <Badge color={l.paid ? "green" : "amber"}>{l.paid ? "Paid" : "Unpaid"}</Badge>
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )}
                    <form action={addBudgetLineAction.bind(null, orgId, b.id)} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                      <Input name="category" placeholder="Category (e.g. Tour fees)" required className="w-40" />
                      <Input name="description" placeholder="Description" className="w-40" />
                      <Input name="amount" type="number" step="0.01" placeholder="Amount" required className="w-28" />
                      <Input name="dueDate" type="date" className="w-36" />
                      <Button type="submit" size="sm">
                        Add line
                      </Button>
                    </form>
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>

        <Card className="self-start">
          <CardHeader title="New season budget" />
          <CardBody>
            <form action={createBudgetAction.bind(null, orgId)} className="space-y-3">
              <Field label="Athlete / Member">
                <Select name="userId" required>
                  {memberships.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Season name">
                <Input name="seasonName" required placeholder="2026 Season" />
              </Field>
              <Field label="Total budget (R)">
                <Input type="number" step="0.01" min="0" name="totalBudget" required />
              </Field>
              <Button type="submit" className="w-full">
                Create budget
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
