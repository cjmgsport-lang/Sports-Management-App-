import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui";
import { createClothingItemAction, createClothingOrderAction, updateClothingOrderStatusAction } from "@/lib/actions/clothing";
import { format } from "date-fns";

const STATUS_COLOR: Record<string, "slate" | "blue" | "amber" | "green" | "red"> = {
  DRAFT: "slate",
  SUBMITTED: "blue",
  CONFIRMED: "amber",
  FULFILLED: "green",
  CANCELED: "red",
};

export default async function ClothingPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireOrgMembership(orgId);

  const [teams, items, orders] = await Promise.all([
    db.team.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    db.clothingItem.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    db.clothingOrder.findMany({
      where: { organizationId: orgId },
      include: { requestedBy: true, team: true, lines: { include: { item: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Clothing Orders" subtitle="Catalogue kit items and manage team clothing orders." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {orders.length === 0 ? (
            <EmptyState title="No orders yet" subtitle="Place your first clothing order." />
          ) : (
            orders.map((o) => (
              <Card key={o.id}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{o.team ? o.team.name : "Organization-wide"}</p>
                        <Badge color={STATUS_COLOR[o.status]}>{o.status}</Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        Requested by {o.requestedBy.name} on {format(o.createdAt, "d MMM yyyy")}
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-600">
                        {o.lines.map((l) => (
                          <li key={l.id}>
                            {l.quantity}× {l.item.name} {l.size ? `(${l.size})` : ""} {l.athleteName ? `— ${l.athleteName}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <form action={updateClothingOrderStatusAction.bind(null, orgId, o.id)} className="flex items-center gap-1.5">
                      <select name="status" defaultValue={o.status} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">
                        <option value="DRAFT">Draft</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="FULFILLED">Fulfilled</option>
                        <option value="CANCELED">Canceled</option>
                      </select>
                      <button type="submit" className="text-xs font-medium text-brand-600 hover:underline">
                        Update
                      </button>
                    </form>
                  </div>
                </CardBody>
              </Card>
            ))
          )}

          <Card>
            <CardHeader title="Kit catalogue" />
            <CardBody>
              {items.length > 0 && (
                <ul className="mb-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                  {items.map((i) => (
                    <li key={i.id}>
                      {i.name} {i.category ? `(${i.category})` : ""} — R{i.unitPrice.toFixed(2)}
                    </li>
                  ))}
                </ul>
              )}
              <form action={createClothingItemAction.bind(null, orgId)} className="grid gap-2 sm:grid-cols-5">
                <Input name="name" placeholder="Item name" required />
                <Input name="category" placeholder="Category" />
                <Input name="sizesAvailable" placeholder="Sizes e.g. S,M,L,XL" />
                <Input name="unitPrice" type="number" step="0.01" min="0" placeholder="Price (R)" />
                <Button type="submit" size="sm">
                  Add item
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>

        <Card className="self-start">
          <CardHeader title="New order" />
          <CardBody>
            <form action={createClothingOrderAction.bind(null, orgId)} className="space-y-3">
              <Field label="Item">
                <Select name="itemId" required>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Size">
                  <Input name="size" placeholder="M" />
                </Field>
                <Field label="Quantity">
                  <Input type="number" name="quantity" min={1} defaultValue={1} required />
                </Field>
              </div>
              <Field label="Athlete name">
                <Input name="athleteName" placeholder="Optional" />
              </Field>
              <Field label="Team (optional)">
                <Select name="teamId" defaultValue="">
                  <option value="">Organization-wide</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button type="submit" className="w-full">
                Place order
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
