"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Lock } from "lucide-react"

interface AccessWaitingModalProps {
  roomName: string
  onClose: () => void
}

export function AccessWaitingModal({ roomName, onClose }: AccessWaitingModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center">
            <Lock className="h-5 w-5 text-orange-600" />
            Kutish rejimida
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <Clock className="h-12 w-12 text-orange-600 mx-auto animate-pulse" />
            <h3 className="font-semibold text-lg">{roomName}</h3>
            <p className="text-gray-600">
              Sizning so'rovingiz admin tomonidan ko'rib chiqilmoqda. Iltimos, sabr qiling.
            </p>
          </div>

          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-sm text-orange-700">
              💡 Admin sizga ruxsat bergandan so'ng avtomatik ravishda guruhga kirasiz.
            </p>
          </div>

          <Button onClick={onClose} className="w-full bg-transparent" variant="outline">
            Yopish
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
