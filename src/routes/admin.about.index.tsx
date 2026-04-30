import { createFileRoute } from "@tanstack/react-router";
import { ContentList } from "@/components/admin/ContentList";

export const Route = createFileRoute("/admin/about/")({
  component: () => (
    <ContentList table="about" editBase="/admin/about" title="关于" newLabel="新建关于页" />
  ),
});
