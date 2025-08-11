"use client"

import type { User } from "firebase/auth"
import type { UserCursor } from "@/hooks/use-map-data"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { X } from "lucide-react"

interface RightNavProps {
  users: UserCursor[]
  currentUser: User | null
  onShare: () => void
  onObserveUser: (userId: string) => void
  onShowUserListModal: () => void
  observingUser: UserCursor | null
  onStopObserving: () => void
}

export function RightNav({
  users,
  currentUser,
  onShare,
  onObserveUser,
  onShowUserListModal,
  observingUser,
  onStopObserving,
}: RightNavProps) {
  const otherUsers = users.filter((u) => u.id !== currentUser?.uid && u.active && u.isBroadcastingCursor)

  const isObservingActiveUser = observingUser && otherUsers.some((u) => u.id === observingUser.id)

  const usersToDisplay = otherUsers.filter(
    (u) => !isObservingActiveUser || (isObservingActiveUser && u.id !== observingUser?.id),
  )

  const visibleUsers = usersToDisplay.slice(0, 2)
  const remainingUsersCount = usersToDisplay.length - visibleUsers.length

  const getFirstChar = (name: string | null | undefined): string => {
    if (!name || typeof name !== "string" || name.length === 0) {
      return "?"
    }
    return name.charAt(0).toUpperCase()
  }

  return (
    <div id="right-nav" className="absolute right-5 top-[15px] z-[40] flex items-center space-x-2">
      {isObservingActiveUser && (
        <Button
          id="stop-observing-button"
          className="h-[35px] w-[35px] rounded-md text-sm font-bold flex items-center justify-center relative p-0 overflow-hidden group"
          onClick={onStopObserving}
          style={{ backgroundColor: observingUser?.color || "#222222" }}
          title={`Kuzatuvni to'xtatish: ${observingUser?.name}`}
        >
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
          <X className="h-5 w-5 text-white z-10 transition-transform duration-200 group-hover:scale-125" />
          <span className="sr-only">Kuzatuvni to'xtatish: {observingUser?.name}</span>
        </Button>
      )}

      {visibleUsers.map((user) => (
        <div
          key={user.id}
          id={`profile-${user.id}`}
          className="avatars flex h-[35px] w-[35px] cursor-pointer items-center justify-center overflow-hidden rounded-md text-sm font-medium text-white"
          style={{ backgroundColor: user.color }}
          data-id={user.id}
          onClick={() => onObserveUser(user.id)}
          title={`Kuzatish: ${user.name}`}
        >
          {user.imgsrc ? (
            <Image
              src={user.imgsrc || "/placeholder.svg"}
              alt={user.name || "User avatar"}
              width={35}
              height={35}
              className="h-full w-full object-cover"
            />
          ) : (
            getFirstChar(user.name)
          )}
        </div>
      ))}

      {remainingUsersCount > 0 && (
        <Button
          className="h-[35px] w-[35px] rounded-md bg-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-300"
          onClick={onShowUserListModal}
          title="Boshqa faol foydalanuvchilar"
        >
          +{remainingUsersCount}
        </Button>
      )}

      <Button
        id="share-button"
        className="h-12 rounded-md bg-black px-5 text-sm font-bold text-white hover:opacity-60"
        onClick={onShare}
      >
        Ulashish
      </Button>
    </div>
  )
}
