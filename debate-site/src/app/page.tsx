import Link from "next/link";
import Image from "next/image";

export default function DebateTeamHomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
              <Image
                src="/team-logo.png"
                alt="辩论队队徽"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-lg text-gray-800">华中科技大学物理学院辩论队</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#about" className="text-gray-600 hover:text-[#9e1b32] transition-colors">关于我们</a>
            <a href="#gallery" className="text-gray-600 hover:text-[#9e1b32] transition-colors">队伍风采</a>
            <a href="#achievements" className="text-gray-600 hover:text-[#9e1b32] transition-colors">赛事成绩</a>
            <a href="#recruitment" className="text-gray-600 hover:text-[#9e1b32] transition-colors">招新信息</a>
            <Link href="/hall-of-fame" className="text-gray-600 hover:text-[#9e1b32] transition-colors">
              辩论名人堂
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#9e1b32]/10 via-[#6d28d9]/5 to-gray-100">
          {/* Abstract geometric shapes */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-[#9e1b32]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#6d28d9]/5 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-[#9e1b32]/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-[#9e1b32]/10 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-[#9e1b32]/10 rounded-full"></div>
        </div>

        <div className="relative z-10 text-center px-4">
          <h1 className="text-6xl font-bold text-gray-900 mb-6 tracking-wider">
            辩以明物，论以穷理
          </h1>
          <p className="text-2xl text-[#9e1b32] mb-10 font-medium">
            问候在座各位！
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="#about"
              className="bg-[#9e1b32] text-white px-8 py-3 rounded-lg hover:bg-[#7a1527] transition-colors font-medium"
            >
              了解我们
            </a>
            <a
              href="#recruitment"
              className="bg-white text-[#9e1b32] border-2 border-[#9e1b32] px-8 py-3 rounded-lg hover:bg-[#9e1b32]/5 transition-colors font-medium"
            >
              加入招新群
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">关于我们</h2>
          <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
            <p className="text-gray-600 leading-relaxed">
              华中科技大学物理学院辩论队是学院官方思辨队伍，覆盖本、硕、博全学段。不管你之前有没有打过辩论、口才好不好，只要对思考和表达有一点兴趣，这里就有你的位置。队里有学长学姐一对一带教，从怎么拆解一个问题、怎么搭建一个论点开始教起，零基础完全不是问题。在一次次的模辩和复盘里，慢慢建立起逻辑思维和表达的自信——这件事没你想的那么难。
            </p>
            <p className="text-gray-600 leading-relaxed">
              我们打比赛是认真的。队伍常年参加校内"喻晓之巅""新生杯"等赛事，拿过冠亚季军，也有博士学长学姐入选校队、在国际赛场上拿了总冠军。每周固定的模辩和复盘是队里的老传统，备赛的时候大家一起熬夜改稿、反复推攻防——但这些不是门槛，而是一群人一起做一件有意思的事。你不需要一开始就很厉害，每一届的队友进了队都是从零开始，一场一场打上来的。
            </p>
            <p className="text-gray-600 leading-relaxed">
              赛场之外，这里更是一个热闹温暖的集体。跨年级的学长学姐经验丰富，也特别愿意分享——辩论上的困惑、学业上的迷茫、生活里的破事，总有人愿意听你讲、帮你出主意。日常聚餐出游、深夜聊天吹水从来不会少。一起熬过夜、赢过也输过的人，慢慢就成了大学里最亲近的朋友。
            </p>
            </div>
          </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">队伍风采</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer"
                style={{
                  backgroundColor: i % 2 === 0 ? '#f3f4f6' : '#e5e7eb'
                }}
              ></div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section id="achievements" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">赛事成绩</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#9e1b32]">
              <div className="text-sm text-gray-500 mb-2">2024年</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">“新生杯”辩论赛</h3>
              <p className="text-[#9e1b32] font-medium">亚军</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#9e1b32]">
              <div className="text-sm text-gray-500 mb-2">2023年</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">“喻晓之巅”辩论赛</h3>
              <p className="text-[#9e1b32] font-medium">亚军</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#9e1b32]">
              <div className="text-sm text-gray-500 mb-2">2021年</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">“喻晓之巅”辩论赛</h3>
              <p className="text-[#9e1b32] font-medium">冠军</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#9e1b32]">
              <div className="text-sm text-gray-500 mb-2">2021年</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">“新生杯”辩论赛</h3>
              <p className="text-[#9e1b32] font-medium">季军</p>
            </div>  
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#9e1b32]">
              <div className="text-sm text-gray-500 mb-2">2020年</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">“新生杯”辩论赛</h3>
              <p className="text-[#9e1b32] font-medium">季军</p>
            </div>                       
          </div>
        </div>
      </section>

      {/* Recruitment Section */}
      <section id="recruitment" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">招新信息</h2>
          <div className="bg-gradient-to-br from-[#9e1b32] to-[#7a1527] rounded-xl shadow-lg p-8 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">加入我们</h3>
                <p className="text-white/90 mb-6 leading-relaxed">
                  无论你是辩论新手还是经验丰富的辩手，物理学院辩论队都欢迎你的加入！在这里，你将收获逻辑思维、表达能力和一群志同道合的朋友。
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-white/70">招新时间：</span>
                    <span>每年9月</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/70">报名方式：</span>
                    <span>扫码加入招新群</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                  <Image
                    src="/招新群二维码.jpg"
                    alt="招新群二维码"
                    width={192}
                    height={192}
                    className="object-cover"
                  />
                </div>
                <p className="text-white/70 text-sm">QQ群：1005481846</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link
              href="/timer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-all"
            >
              <span className="text-lg">⏱</span> 辩论计时器
            </Link>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>© 2026 华中科技大学物理学院辩论队</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
