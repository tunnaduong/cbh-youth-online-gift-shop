// A template (unlike layout) gets a fresh key on every navigation, so its
// children remount and the CSS animation replays each time you move between
// pages (/, /product/[id], /cart, /checkout, /orders) - see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/template.md.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
