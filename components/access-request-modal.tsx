"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, UserCheck } from "lucide-react"

interface AccessRequestModalProps {
  roomName: string
  onRequestAccess: () => Promise<void>
  onClose: () => void
}

export function AccessRequestModal({ roomName, onRequestAccess, onClose }: AccessRequestModalProps) {
  const [loading, setLoading] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  const handleRequestAccess = async () => {
    setLoading(true)
    try {
      await onRequestAccess()
      setRequestSent(true)
    } catch (error) {
      console.error("Error requesting access:", error)
      alert("So'rov yuborishda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center">
            <Lock className="h-5 w-5 text-red-600" />
            Yopiq Guruh
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {!requestSent ? (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{roomName}</h3>
                <p className="text-gray-600">Bu yopiq guruh. Kirish uchun admin ruxsatini so'rashingiz kerak.</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={loading}>
                  Bekor qilish
                </Button>
                <Button onClick={handleRequestAccess} disabled={loading} className="flex-1">
                  {loading ? "Yuborilmoqda..." : "Ruxsat so'rash"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <UserCheck className="h-12 w-12 text-green-600 mx-auto" />
                <h3 className="font-semibold text-lg">So'rov yuborildi!</h3>
                <p className="text-gray-600">Admin sizning so'rovingizni ko'rib chiqadi. Javobni kutib turing.</p>
              </div>

              <Button onClick={onClose} className="w-full">
                Yopish
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
