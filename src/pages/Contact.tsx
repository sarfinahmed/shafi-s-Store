import React, { useEffect, useState } from "react";
import { db, User, SocialLink } from "../lib/db";
import { ExternalLink } from "lucide-react";
import { motion } from "motion/react";

export function Contact() {
  const [admin, setAdmin] = useState<User | null>(null);
  const [adminLinks, setAdminLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getAdminUsers().then(async (admins) => {
      if (admins.length > 0) {
        const topAdmin = admins[0];
        setAdmin(topAdmin);
        const links = await db.getLinks(topAdmin.id);
        setAdminLinks(links);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-20 text-zinc-500 font-medium">Loading contact info...</div>;

  if (!admin) return <div className="text-center py-20 text-zinc-500 font-medium">No contact information available.</div>;

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 text-white">
          Contact Us
        </h1>
        <p className="text-base md:text-lg font-medium text-zinc-500 whitespace-pre-wrap max-w-xl">
          {admin.bio || "Reach out to us through any of our social platforms."}
        </p>

        {adminLinks.length > 0 && (
          <div className="w-full flex flex-col gap-3 mt-10">
            {adminLinks.map((link, i) => {
              const isWhatsApp = link.platform.toLowerCase().includes('whatsapp');
              let href = link.url;
              if (isWhatsApp && !link.url.toLowerCase().startsWith('http') && !link.url.toLowerCase().startsWith('wa.me')) {
                const numberOnly = link.url.replace(/[^\d]/g, '');
                href = `https://wa.me/${numberOnly}`;
              } else if (!link.url.toLowerCase().startsWith('http') && !link.url.toLowerCase().startsWith('mailto:')) {
                href = `https://${link.url}`;
              }

              return (
              <motion.div 
                key={link.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between px-6 py-4 bg-[#0a0a0a] border border-zinc-900 hover:border-zinc-700 rounded-2xl font-bold text-zinc-300 hover:text-white hover:bg-[#111] transition-all shadow-sm group"
                >
                  <span className="text-lg">{link.platform}</span>
                  <ExternalLink className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
                </a>
              </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
