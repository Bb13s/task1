'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface HallOfFamer {
  id: number;
  name: string;
  grade: string;
  role: string;
  bio: string;
  achievements: string[];
  avatar?: string;
}

const allMembers: HallOfFamer[] = [
  // 2025级
  { id: 21, name: "徐经纬", grade: "2025级", role: "笨笨十三少", bio: "代码跑不通可以 debug，论点拆不动可以喊队友。", achievements: ["网站搭建者"], avatar: "/hall-of-fame/xujingwei.jpg" },
  { id: 22, name: "王思远", grade: "2025级", role: "半截的诗", bio: "我都这么菜了，怎么还不是你的菜？", achievements: ["25级新生杯佳辩"], avatar: "/hall-of-fame/wangsiyuan.jpg" },
  { id: 23, name: "江安博", grade: "2025级", role: "maodai86", bio: "都是同龄人我原本没想降维打击！", achievements: ["25级新生杯佳辩"], avatar: "/hall-of-fame/jianganbo.jpg" },
  { id: 24, name: "刘名扬", grade: "2025级", role: "刘名扬", bio: "你想约谁打模辩？我微信都有。", achievements: ["校辩论社副社长"], avatar: "/hall-of-fame/liumingyang.jpg" },
  { id: 25, name: "董征", grade: "2025级", role: "董", bio: "你尽管输出，破防了算我输。", achievements: ["物院辩论队最坚固的盾"], avatar: "/hall-of-fame/dongzheng.jpg" },
  { id: 26, name: "鲍嘉明", grade: "2025级", role: "石英", bio: "剑不需要多动，对面自己会慌。", achievements: ["物院辩论队最锋利的剑"], avatar: "/hall-of-fame/baojiaming.jpg" },
];

const grades = ["全部", "2018级", "2019级", "2020级", "2021级", "2022级", "2023级", "2024级", "2025级"];

export default function HallOfFamePage() {
  const [activeGrade, setActiveGrade] = useState("全部");

  const filteredMembers = activeGrade === "全部"
    ? allMembers
    : allMembers.filter(m => m.grade === activeGrade);

  const allLockedGrades = grades.filter(g => g !== "全部" && g !== "2025级");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#2c1810" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: "rgba(44,24,16,0.94)",
          borderColor: "rgba(196,148,58,0.12)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full overflow-hidden ring-2"
              style={{ ringColor: "rgba(196,148,58,0.3)", backgroundColor: "#3d2c24" }}
            >
              <Image src="/team-logo.png" alt="队徽" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span
              className="font-bold text-lg"
              style={{ color: "#e8d5c4", fontFamily: "var(--font-serif)" }}
            >
              华中科技大学物理学院辩论队
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/#about" style={{ color: "#8b7355" }} className="hover:text-[#e8d5c4] transition-colors">关于我们</Link>
            <Link href="/#gallery" style={{ color: "#8b7355" }} className="hover:text-[#e8d5c4] transition-colors">队伍风采</Link>
            <Link href="/#achievements" style={{ color: "#8b7355" }} className="hover:text-[#e8d5c4] transition-colors">赛事成绩</Link>
            <Link href="/#recruitment" style={{ color: "#8b7355" }} className="hover:text-[#e8d5c4] transition-colors">招新信息</Link>
            <span style={{ color: "#c4943a", fontFamily: "var(--font-serif)" }} className="font-medium">
              辩论名人堂
            </span>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute top-10 left-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(196,148,58,0.08)" }}
          ></div>
          <div
            className="absolute bottom-10 right-1/4 w-64 h-64 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(158,27,50,0.08)" }}
          ></div>
          <div
            className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(196,148,58,0.04)" }}
          ></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <div
            className="inline-block px-4 py-1 rounded-full text-sm mb-6 tracking-wider"
            style={{
              border: "1px solid rgba(196,148,58,0.25)",
              color: "#c4943a",
            }}
          >
            物理学院辩论队 · 荣誉殿堂
          </div>
          <h1
            className="text-5xl font-bold mb-4 tracking-[0.08em]"
            style={{ color: "#e8d5c4", fontFamily: "var(--font-serif)" }}
          >
            辩论名人堂
          </h1>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: "#8b7355" }}>
            一届又一届的辩手在这里留下足迹，用语言与逻辑书写属于物院的辩论篇章
          </p>
        </div>
      </section>

      {/* Grade Filter */}
      <section className="px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3">
            {grades.map((grade) => (
              <button
                key={grade}
                onClick={() => setActiveGrade(grade)}
                className="px-5 py-2 rounded-full text-sm font-medium transition-all"
                style={
                  activeGrade === grade
                    ? {
                        backgroundColor: "#c4943a",
                        color: "#2c1810",
                        boxShadow: "0 2px 12px rgba(196,148,58,0.2)",
                      }
                    : {
                        backgroundColor: "rgba(255,255,255,0.06)",
                        color: "#8b7355",
                      }
                }
                onMouseEnter={(e) => {
                  if (activeGrade !== grade) {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.color = "#e8d5c4";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeGrade !== grade) {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.color = "#8b7355";
                  }
                }}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Card Grid */}
      <section className="pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm mb-6 text-center" style={{ color: "#8b7355" }}>
            共 {filteredMembers.length} 位辩手
          </p>

          {activeGrade === "全部" && (
            <div className="mb-10">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {allLockedGrades.map((grade) => (
                  <div
                    key={grade}
                    className="rounded-xl p-4 text-center transition-all cursor-default"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: "1px dashed rgba(196,148,58,0.15)",
                    }}
                  >
                    <div
                      className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "#8b7355" }}
                    >
                      🔒
                    </div>
                    <p className="text-sm font-medium" style={{ color: "#8b7355" }}>{grade}</p>
                    <p className="text-xs mt-1" style={{ color: "#5a3f2e" }}>待解锁</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="rounded-xl p-5 transition-all group"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(196,148,58,0.3)";
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
                }}
              >
                {/* Avatar */}
                <div className="flex justify-center mb-4">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl overflow-hidden ring-2 transition-all"
                    style={{
                      background: "linear-gradient(135deg, rgba(196,148,58,0.2), rgba(44,24,16,0.8))",
                      ringColor: "rgba(255,255,255,0.1)",
                    }}
                  >
                    {member.avatar ? (
                      <Image src={member.avatar} alt={member.name} width={80} height={80} className="w-full h-full object-cover" />
                    ) : (
                      member.name[0]
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="text-center mb-3">
                  <h3 className="font-bold text-lg" style={{ color: "#e8d5c4" }}>{member.name}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-xs font-medium" style={{ color: "#c4943a" }}>{member.grade}</span>
                    <span style={{ color: "#5a3f2e" }}>·</span>
                    <span className="text-xs" style={{ color: "#8b7355" }}>{member.role}</span>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-center mb-4" style={{ color: "#8b7355" }}>
                  &ldquo;{member.bio}&rdquo;
                </p>

                {/* Achievements */}
                <div className="flex flex-wrap justify-center gap-2">
                  {member.achievements.map((achievement, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: "rgba(196,148,58,0.1)",
                        color: "#c4943a",
                        border: "1px solid rgba(196,148,58,0.2)",
                      }}
                    >
                      {achievement}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredMembers.length === 0 && activeGrade !== "全部" && (
            <div className="text-center py-16">
              <p className="text-lg" style={{ color: "#8b7355" }}>🔒 更多神秘学长姐大人有待解锁！</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t py-12"
        style={{ borderColor: "rgba(196,148,58,0.1)", backgroundColor: "#2c1810" }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link
              href="/timer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                color: "#8b7355",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
              }}
            >
              <span className="text-lg">⏱</span> 辩论计时器
            </Link>
          </div>
          <div
            className="border-t pt-8 text-center text-sm"
            style={{ borderColor: "rgba(255,255,255,0.06)", color: "#5a3f2e" }}
          >
            <p>© 2026 华中科技大学物理学院辩论队 版权所有</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
