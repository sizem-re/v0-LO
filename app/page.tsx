import EmailForm from "@/components/email-form"
import { BIZ_UDMincho as Biz_UDMincho } from "next/font/google"

const bizUDMincho = Biz_UDMincho({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
})

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Pure blue background */}
      <div className="absolute inset-0 bg-[#0000FF]" aria-hidden="true" />

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
            {/* Left side - Logo */}
            <div className="text-white">
              <h1 className={`${bizUDMincho.className} text-[12rem] md:text-[16rem] font-bold leading-none`}>LO</h1>
            </div>

            {/* Right side - Tagline and form */}
            <div className="text-white space-y-8">
              <h2 className="text-3xl md:text-5xl font-medium leading-tight">
                places picked by people,
                <br />
                not algorithms.
              </h2>

              <EmailForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
