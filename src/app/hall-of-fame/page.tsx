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
  // 2018级
  { id: 1, name: "啦啦啦", grade: "2018级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  { id: 2, name: "啦啦啦", grade: "2018级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  { id: 3, name: "啦啦啦", grade: "2018级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  // 2019级
  { id: 4, name: "啦啦啦", grade: "2019级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  { id: 5, name: "啦啦啦", grade: "2019级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  { id: 6, name: "啦啦啦", grade: "2019级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  { id: 7, name: "啦啦啦", grade: "2019级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  // 2020级
  { id: 8, name: "啦啦啦", grade: "2020级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  { id: 9, name: "啦啦啦", grade: "2020级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  { id: 10, name: "啦啦啦", grade: "2020级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  // 2021级
  { id: 11, name: "啦啦啦", grade: "2021级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  { id: 12, name: "啦啦啦", grade: "2021级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  // 2022级
  { id: 13, name: "啦啦啦", grade: "2022级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  { id: 14, name: "啦啦啦", grade: "2022级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  { id: 15, name: "啦啦啦", grade: "2022级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  // 2023级
  { id: 16, name: "啦啦啦", grade: "2023级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  { id: 17, name: "啦啦啦", grade: "2023级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  { id: 18, name: "啦啦啦", grade: "2023级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  // 2024级
  { id: 19, name: "啦啦啦", grade: "2024级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  { id: 20, name: "啦啦啦", grade: "2024级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"] },
  // 2025级
  { id: 21, name: "徐经纬", grade: "2025级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"], avatar: "/hall-of-fame/xujingwei.jpg" },
  { id: 22, name: "王思远", grade: "2025级", role: "半截的诗", bio: "我都这么菜了，怎么还不是你的菜？", achievements: ["25级新生杯佳辩"], avatar: "/hall-of-fame/wangsiyuan.jpg" },
  { id: 23, name: "江安博", grade: "2025级", role: "maodai86", bio: "都是同龄人我原本没想降维打击！", achievements: ["25级新生杯佳辩"], avatar: "/hall-of-fame/jianganbo.jpg" },
  { id: 24, name: "刘名扬", grade: "2025级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"], avatar: "/hall-of-fame/liumingyang.jpg" },
  { id: 25, name: "董征", grade: "2025级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"], avatar: "/hall-of-fame/dongzheng.jpg" },
  { id: 26, name: "鲍嘉明", grade: "2025级", role: "啦啦啦", bio: "啦啦啦", achievements: ["啦啦啦"], avatar: "/hall-of-fame/baojiaming.jpg" },
];

const grades = ["全部", "2018级", "2019级", "2020级", "2021级", "2022级", "2023级", "2024级", "2025级"];

export default function HallOfFamePage() {
  const [activeGrade, setActiveGrade] = useState("全部");

  const filteredMembers = activeGrade === "全部"
    ? allMembers
    : allMembers.filter(m => m.grade === activeGrade);

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="bg-[#0f172a] border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
              <Image src="/team-logo.png" alt="队徽" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-lg text-white">华中科技大学物理学院辩论队</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/#about" className="text-gray-400 hover:text-white transition-colors">关于我们</Link>
            <Link href="/#gallery" className="text-gray-400 hover:text-white transition-colors">队伍风采</Link>
            <Link href="/#achievements" className="text-gray-400 hover:text-white transition-colors">赛事成绩</Link>
            <Link href="/#recruitment" className="text-gray-400 hover:text-white transition-colors">招新信息</Link>
            <span className="text-[#9e1b32] font-medium">辩论名人堂</span>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#0f172a] to-[#0f172a]">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#9e1b32]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-[#6d28d9]/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-[#9e1b32]/5 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <div className="inline-block px-4 py-1 rounded-full border border-[#9e1b32]/30 text-[#9e1b32] text-sm mb-6">
            物理学院辩论队 · 荣誉殿堂
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-wider">辩论名人堂</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
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
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeGrade === grade
                    ? 'bg-[#9e1b32] text-white shadow-lg shadow-[#9e1b32]/20'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
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
          <p className="text-gray-500 text-sm mb-6 text-center">
            共 {filteredMembers.length} 位辩手
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 hover:border-[#9e1b32]/30 hover:bg-gray-900 transition-all group"
              >
                {/* Avatar */}
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#9e1b32]/30 to-gray-800 flex items-center justify-center text-white font-bold text-2xl overflow-hidden ring-2 ring-gray-700 group-hover:ring-[#9e1b32]/50 transition-all">
                    {member.avatar ? (
                      <Image src={member.avatar} alt={member.name} width={80} height={80} className="w-full h-full object-cover" />
                    ) : (
                      member.name[0]
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="text-center mb-3">
                  <h3 className="text-white font-bold text-lg">{member.name}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-[#9e1b32] text-xs font-medium">{member.grade}</span>
                    <span className="text-gray-600">·</span>
                    <span className="text-gray-400 text-xs">{member.role}</span>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-gray-500 text-sm text-center mb-4">&ldquo;{member.bio}&rdquo;</p>

                {/* Achievements */}
                <div className="flex flex-wrap justify-center gap-2">
                  {member.achievements.map((achievement, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full bg-[#9e1b32]/10 text-[#9e1b32] border border-[#9e1b32]/20"
                    >
                      {achievement}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredMembers.length === 0 && (
            <p className="text-gray-500 text-center py-16">暂无数据</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] border-t border-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-md mx-auto mb-8">
            <h4 className="font-bold text-white text-lg mb-5 text-center">辩论队自研功能</h4>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-all"
              >
                <span className="text-lg">📚</span> 知识库
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>© 2026 华中科技大学物理学院辩论队 版权所有</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
