"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";

const galleryImages = [
  "/队伍风采图片1.jpg",
  "/队伍风采图片2.jpg",
  "/队伍风采图片3.jpg",
  "/队伍风采图片4.jpg",
  "/队伍风采图片5.jpeg",
  "/队伍风采图片6.jpeg",
  "/队伍风采图片7.jpeg",
  "/队伍风采图片8.jpeg",
  "/队伍风采图片9.jpg",
  "/队伍风采图片10.jpg",
  "/队伍风采图片11.jpg",
  "/队伍风采图片12.jpeg",
];

const achievements = [
  { year: "2024", event: "新生杯" + "辩论赛", result: "亚军", tier: "silver" },
  { year: "2023", event: "喻晓之巅" + "辩论赛", result: "亚军", tier: "silver" },
  { year: "2021", event: "喻晓之巅" + "辩论赛", result: "冠军", tier: "gold" },
  { year: "2021", event: "新生杯" + "辩论赛", result: "季军", tier: "bronze" },
  { year: "2020", event: "新生杯" + "辩论赛", result: "季军", tier: "bronze" },
];

const tierColors: Record<string, { dot: string; text: string }> = {
  gold: { dot: "bg-[#c4943a]", text: "text-[#c4943a]" },
  silver: { dot: "bg-[#9ca3af]", text: "text-[#6b7280]" },
  bronze: { dot: "bg-[#b8855c]", text: "text-[#b8855c]" },
};

export default function DebateTeamHomePage() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    const elements = document.querySelectorAll(".animate-section");
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fefaf5" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: "rgba(254,250,245,0.92)",
          borderColor: "#e8ddd0",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#f5f0e8] ring-2 ring-[#9e1b32]/10">
              <Image
                src="/team-logo.png"
                alt="辩论队队徽"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className="font-bold text-lg tracking-wide"
              style={{
                fontFamily: "var(--font-serif)",
                color: "#2c1810",
              }}
            >
              华中科技大学物理学院辩论队
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            {[
              { href: "#about", label: "关于我们" },
              { href: "#gallery", label: "队伍风采" },
              { href: "#achievements", label: "赛事成绩" },
              { href: "#recruitment", label: "招新信息" },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="transition-colors"
                style={{ color: "#8b7355" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#9e1b32")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8b7355")}
              >
                {label}
              </a>
            ))}
            <Link
              href="/hall-of-fame"
              className="transition-colors"
              style={{ color: "#8b7355" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#9e1b32")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8b7355")}
            >
              辩论名人堂
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="relative min-h-[620px] flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: "#fefaf5" }}
      >
        {/* Subtle texture */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(158,27,50,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(196,148,58,0.04) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(158,27,50,0.03) 0%, transparent 40%)",
          }}
        ></div>

        {/* Gold accent lines */}
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-16 h-px bg-[#c4943a]/30"></div>
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-24 h-px bg-[#c4943a]/20"></div>

        {/* Vertical decorative lines */}
        <div
          className="absolute left-16 top-1/4 w-px h-32 hidden lg:block"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(196,148,58,0.2), transparent)",
          }}
        ></div>
        <div
          className="absolute right-16 top-1/4 w-px h-32 hidden lg:block"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(196,148,58,0.2), transparent)",
          }}
        ></div>

        <div className="relative z-10 text-center px-4">
          <div
            className="inline-block mb-8 tracking-[0.3em] text-xs uppercase"
            style={{ color: "#c4943a" }}
          >
            物理学院 · 思辨队伍
          </div>
          <h1
            className="text-5xl md:text-7xl font-bold mb-6 tracking-[0.08em] leading-tight animate-section"
            style={{
              fontFamily: "var(--font-serif)",
              color: "#2c1810",
            }}
          >
            辩以明物
            <br />
            论以穷理
          </h1>
          <div className="decorative-line mx-auto mb-8"></div>
          <p
            className="text-lg md:text-xl mb-12 italic tracking-wider animate-section"
            style={{ color: "#8b7355", fontFamily: "var(--font-serif)" }}
          >
            问候在座各位！
          </p>
          <div className="flex items-center justify-center gap-4 animate-section delay-1">
            <a
              href="#about"
              className="px-8 py-3 rounded-lg text-white font-medium transition-all hover:shadow-lg tracking-wide"
              style={{
                backgroundColor: "#9e1b32",
                boxShadow: "0 2px 12px rgba(158,27,50,0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#7a1527";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(158,27,50,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#9e1b32";
                e.currentTarget.style.boxShadow =
                  "0 2px 12px rgba(158,27,50,0.15)";
              }}
            >
              了解我们
            </a>
            <a
              href="#recruitment"
              className="px-8 py-3 rounded-lg font-medium transition-all tracking-wide"
              style={{
                backgroundColor: "transparent",
                color: "#9e1b32",
                border: "2px solid #9e1b32",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(158,27,50,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              加入招新群
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="py-24"
        style={{ backgroundColor: "#f5f0e8" }}
      >
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12 animate-section">
            <div
              className="text-xs tracking-[0.3em] uppercase mb-3"
              style={{ color: "#c4943a" }}
            >
              About Us
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-wide"
              style={{
                fontFamily: "var(--font-serif)",
                color: "#2c1810",
              }}
            >
              关于我们
            </h2>
            <div className="decorative-line mx-auto mt-4"></div>
          </div>

          <div
            className="rounded-xl p-8 md:p-10 space-y-6 animate-section delay-1"
            style={{
              backgroundColor: "#fffbf7",
              boxShadow: "0 4px 24px rgba(44,24,16,0.06)",
              border: "1px solid rgba(196,148,58,0.12)",
            }}
          >
            <p
              className="leading-relaxed drop-cap"
              style={{ color: "#3d2c24", fontSize: "1.05rem" }}
            >
              华中科技大学物理学院辩论队是学院官方思辨队伍，覆盖本、硕、博全学段。不管你之前有没有打过辩论、口才好不好，只要对思考和表达有一点兴趣，这里就有你的位置。队里有学长学姐一对一带教，从怎么拆解一个问题、怎么搭建一个论点开始教起，零基础完全不是问题。在一次次的模辩和复盘里，慢慢建立起逻辑思维和表达的自信——这件事没你想的那么难。
            </p>
            <p
              className="leading-relaxed"
              style={{ color: "#3d2c24", fontSize: "1.05rem" }}
            >
              我们打比赛是认真的。队伍常年参加校内"喻晓之巅""新生杯"等赛事，拿过冠亚季军，也有博士学长学姐入选校队、在国际赛场上拿了总冠军。每周固定的模辩和复盘是队里的老传统，备赛的时候大家一起熬夜改稿、反复推攻防——但这些不是门槛，而是一群人一起做一件有意思的事。你不需要一开始就很厉害，每一届的队友进了队都是从零开始，一场一场打上来的。
            </p>
            <p
              className="leading-relaxed"
              style={{ color: "#3d2c24", fontSize: "1.05rem" }}
            >
              赛场之外，这里更是一个热闹温暖的集体。跨年级的学长学姐经验丰富，也特别愿意分享——辩论上的困惑、学业上的迷茫、生活里的破事，总有人愿意听你讲、帮你出主意。日常聚餐出游、深夜聊天吹水从来不会少。一起熬过夜、赢过也输过的人，慢慢就成了大学里最亲近的朋友。
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section
        id="gallery"
        className="py-24 overflow-hidden"
        style={{ backgroundColor: "#fefaf5" }}
      >
        <div className="max-w-full mx-auto">
          <div className="text-center mb-12 px-4 animate-section">
            <div
              className="text-xs tracking-[0.3em] uppercase mb-3"
              style={{ color: "#c4943a" }}
            >
              Gallery
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-wide"
              style={{
                fontFamily: "var(--font-serif)",
                color: "#2c1810",
              }}
            >
              队伍风采
            </h2>
            <div className="decorative-line mx-auto mt-4"></div>
          </div>

          {/* Fade masks */}
          <div className="relative">
            <div
              className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, #fefaf5 0%, transparent 100%)",
              }}
            ></div>
            <div
              className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
              style={{
                background:
                  "linear-gradient(270deg, #fefaf5 0%, transparent 100%)",
              }}
            ></div>
            <div className="gallery-scroll flex gap-5 w-max px-8">
              {[...galleryImages, ...galleryImages].map((src, i) => (
                <div
                  key={i}
                  className="h-64 w-auto flex-shrink-0 rounded-lg overflow-hidden border-2"
                  style={{ borderColor: "#e8ddd0" }}
                >
                  <Image
                    src={src}
                    alt={`队伍风采图片 ${(i % galleryImages.length) + 1}`}
                    width={384}
                    height={256}
                    className="h-full w-auto object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section
        id="achievements"
        className="py-24"
        style={{ backgroundColor: "#f5f0e8" }}
      >
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16 animate-section">
            <div
              className="text-xs tracking-[0.3em] uppercase mb-3"
              style={{ color: "#c4943a" }}
            >
              Honors
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-wide"
              style={{
                fontFamily: "var(--font-serif)",
                color: "#2c1810",
              }}
            >
              赛事成绩
            </h2>
            <div className="decorative-line mx-auto mt-4"></div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px"
              style={{
                backgroundColor: "#e8ddd0",
                transform: "translateX(-50%)",
              }}
            ></div>

            <div className="space-y-8">
              {achievements.map((item, i) => {
                const tier = tierColors[item.tier];
                const isLeft = i % 2 === 0;
                return (
                  <div
                    key={i}
                    className={`animate-section delay-${Math.min(i, 5)} relative flex items-center ${
                      isLeft ? "md:flex-row" : "md:flex-row-reverse"
                    } flex-row`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-4 md:left-1/2 z-10" style={{ transform: "translateX(-50%)" }}>
                      <div className={`w-3 h-3 rounded-full ${tier.dot} ring-4 ring-[#f5f0e8]`}></div>
                    </div>

                    {/* Content card */}
                    <div
                      className={`ml-10 md:ml-0 md:w-[calc(50%-2rem)] ${
                        isLeft ? "md:pr-8 md:text-right" : "md:pl-8"
                      }`}
                    >
                      <div
                        className="inline-block rounded-lg p-5 text-left w-full animate-section"
                        style={{
                          backgroundColor: "#fffbf7",
                          border: "1px solid rgba(196,148,58,0.12)",
                          boxShadow: "0 2px 12px rgba(44,24,16,0.04)",
                        }}
                      >
                        <div
                          className="text-xs tracking-wider mb-1"
                          style={{ color: "#8b7355" }}
                        >
                          {item.year}年
                        </div>
                        <h3
                          className="text-lg font-bold mb-1"
                          style={{ color: "#2c1810" }}
                        >
                          {item.event}
                        </h3>
                        <p
                          className={`font-bold text-lg ${tier.text}`}
                          style={{ fontFamily: "var(--font-serif)" }}
                        >
                          {item.result}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Recruitment Section */}
      <section
        id="recruitment"
        className="py-24"
        style={{ backgroundColor: "#fefaf5" }}
      >
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12 animate-section">
            <div
              className="text-xs tracking-[0.3em] uppercase mb-3"
              style={{ color: "#c4943a" }}
            >
              Join Us
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-wide"
              style={{
                fontFamily: "var(--font-serif)",
                color: "#2c1810",
              }}
            >
              招新信息
            </h2>
            <div className="decorative-line mx-auto mt-4"></div>
          </div>

          <div
            className="rounded-xl shadow-lg p-8 md:p-10 text-white relative overflow-hidden animate-section delay-1"
            style={{
              background: "linear-gradient(135deg, #9e1b32 0%, #7a1527 100%)",
            }}
          >
            {/* Gold corner accents */}
            <div
              className="absolute top-4 left-4 w-8 h-8 opacity-40"
              style={{
                borderTop: "1.5px solid #c4943a",
                borderLeft: "1.5px solid #c4943a",
              }}
            ></div>
            <div
              className="absolute bottom-4 right-4 w-8 h-8 opacity-40"
              style={{
                borderBottom: "1.5px solid #c4943a",
                borderRight: "1.5px solid #c4943a",
              }}
            ></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
              <div>
                <h3
                  className="text-2xl font-bold mb-4 tracking-wide"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  加入我们
                </h3>
                <p className="text-white/90 mb-6 leading-relaxed">
                  无论你是辩论新手还是经验丰富的辩手，物理学院辩论队都欢迎你的加入！在这里，你将收获逻辑思维、表达能力和一群志同道合的朋友。
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-white/60">招新时间：</span>
                    <span>每年9月</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/60">报名方式：</span>
                    <span>扫码加入招新群</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div
                  className="w-48 h-48 rounded-lg flex items-center justify-center mb-4 overflow-hidden"
                  style={{
                    backgroundColor: "#fffbf7",
                    border: "2px solid rgba(196,148,58,0.4)",
                  }}
                >
                  <Image
                    src="/招新群二维码.jpg"
                    alt="招新群二维码"
                    width={192}
                    height={192}
                    className="object-cover"
                  />
                </div>
                <p className="text-white/60 text-sm">QQ群：1005481846</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ backgroundColor: "#2c1810" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link
              href="/timer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                color: "#e8d5c4",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.14)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.08)";
              }}
            >
              <span className="text-lg">⏱</span> 辩论计时器
            </Link>
          </div>
          <div
            className="border-t pt-8 text-center text-sm"
            style={{ borderColor: "rgba(255,255,255,0.1)", color: "#8b7355" }}
          >
            <p>© 2026 华中科技大学物理学院辩论队</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
