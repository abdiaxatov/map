"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserX } from "lucide-react"

interface AccessDeniedModalProps {
  roomName: string
  onClose: () => void
}

export function AccessDeniedModal({ roomName, onClose }: AccessDeniedModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center text-red-600">
            <UserX className="h-5 w-5" />
            Ruxsat berilmadi
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{roomName}</h3>
            <p className="text-gray-600">Afsuski, sizga bu guruhga kirish uchun ruxsat berilmadi.</p>
          </div>

          <Button onClick={onClose} className="w-full" variant="destructive">
            Yopish
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
