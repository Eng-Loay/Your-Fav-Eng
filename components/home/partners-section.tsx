"use client"

import { m } from "framer-motion"
import { Handshake } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"

const partners = [
  {
    name: "TikTok",
    subtitle: "@pds.agency",
    color: "#EB2D3C",
    initials: "TT",
  },
  {
    name: "Instagram",
    subtitle: "@pds_agency0",
    color: "#E4405F",
    initials: "IG",
  },
  {
    name: "WhatsApp",
    subtitle: "Channel updates",
    color: "#25D366",
    initials: "WA",
  },
  {
    name: "Telegram",
    subtitle: "Resource hub",
    color: "#0088cc",
    initials: "TG",
  },
  {
    name: "PDS",
    subtitle: "Courses & store",
    color: "#1a1a2e",
    initials: "P",
  },
]

export default function PartnersSection() {
  const { locale } = useI18n()
  const isAr = locale === "ar"

  return (
    <section className="relative py-20 bg-gray-50 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #EB2D3C 0.5px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <Badge className="mb-4 border-medex-red/20 bg-red-50 text-medex-red hover:bg-red-50 px-4 py-1.5 text-sm font-semibold">
            <Handshake className="w-4 h-4 mr-1.5" />
            {isAr ? "شركاؤنا" : "Our Partners"}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-medex-dark mb-4">
            {isAr ? "حضورك حيث يتواجد جمهورك" : "Meet audiences where they scroll"}
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            {isAr
              ? "من تيك توك وإنستغرام إلى واتساب وتيليغرام — قنوات ننشط عليها يومياً"
              : "From TikTok and Instagram to WhatsApp and Telegram—channels we operate every day"}
          </p>
        </m.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {partners.map((partner, i) => (
            <m.div
              key={partner.name}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -6, scale: 1.03 }}
              className="group relative flex flex-col items-center rounded-2xl border border-gray-200/60 bg-white p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-medex-red/20"
            >
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${partner.color}10` }}
              >
                <span
                  className="text-2xl font-black tracking-tight"
                  style={{ color: partner.color }}
                >
                  {partner.initials}
                </span>
              </div>
              <h3 className="text-base font-bold text-medex-dark text-center mb-1 group-hover:text-medex-red transition-colors">
                {partner.name}
              </h3>
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                {partner.subtitle}
              </p>
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-0 rounded-t-full transition-all duration-300 group-hover:w-12"
                style={{ backgroundColor: partner.color }}
              />
            </m.div>
          ))}
        </div>
      </div>
    </section>
  )
}
