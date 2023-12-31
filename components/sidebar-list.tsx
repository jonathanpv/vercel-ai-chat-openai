export interface SidebarListProps {
  userId?: string
}

export async function SidebarList({ userId }: SidebarListProps) {
  const chats = []

  return (
    <div className="flex-1 overflow-auto">
      {chats?.length ? (
        <div className="space-y-2 px-2">
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No chat history</p>
        </div>
      )}
    </div>
  )
}
