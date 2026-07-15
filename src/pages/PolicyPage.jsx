/*
 * Copyright (C) 2026 FjiNeko
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MainNav from '../components/MainNav';
import SiteFooter from '../components/SiteFooter';
import '../css/main.css';

const EMAIL_CONTACT = "policy-legal@cgbgear.cn";

const POLICY_DATA = {
  // --- 1. 隐私政策 ---
  'privacy': {
    title: 'CGBGEAR 隐私政策',
    updated: '2026年2月17日',
    effective: '2026年2月17日',
    content: (
      <>
        <p>CGBGEAR（以下简称“本平台”）深知个人信息对您的重要性，我们将按照法律法规要求，采取相应的安全保护措施，恪守“正当、合法、必要”原则处理您的个人信息。</p>
        
        <h2>一、我们如何收集和使用您的个人信息</h2>
        <p>为向您提供稳定、安全的专业论坛服务，我们会在以下场景中收集您的信息：</p>
        <ul>
          <li><strong>账户注册与身份验证：</strong>您注册时需提供<strong>电子邮箱地址</strong>并设置密码。这是为了识别您的唯一用户身份，并确保账号的安全权属。</li>
          <li><strong>设备与访问安全：</strong>为防范非法攻击、垃圾注册及盗号行为，我们会收集您的<strong>设备型号、操作系统版本、唯一设备标识符、IP地址及访问日志</strong>。</li>
          <li><strong>社区互动记录：</strong>我们会记录您的<strong>发帖、评论、收藏及点赞轨迹</strong>。这是实现社区基本功能及内容管理（如申诉处理、违规溯源）所必需的。</li>
          <li><strong>位置信息说明：</strong>我们仅在部分本地化功能中（如周边活动）请求地理位置权限，且仅在您明确授权后获取，您可以随时关闭。</li>
        </ul>

        <h2>二、信息的存储与保护</h2>
        <p>我们采用行业标准的加密技术（如SSL加密）及访问控制机制保护您的个人数据。数据存储期限为实现服务目的所必需的最短时间，除非法律另有强制规定。</p>

        <h2>三、用户行使权利的方式</h2>
        <p>您可以通过账号设置随时查询、更正、删除您的个人信息。如需彻底<strong>注销账号</strong>，请发送邮件至联系地址，我们将在核实身份后 15 个工作日内处理。</p>
      </>
    )
  },

  // --- 2. 社区管理规范 ---
  'community': {
    title: 'CGBGEAR 社区管理规范',
    updated: '2026年2月17日',
    content: (
      <>
        <p>为维护 CGBGEAR 战术装备社区的专业氛围，全体用户须遵守本规范。本规范适用于所有注册用户及游客。</p>
        
        <h2>一、账号准则</h2>
        <ul>
          <li><strong>实名标识：</strong>严禁使用涉政、色情、谩骂、仿冒官方或误导他人的昵称及头像。</li>
          <li><strong>单一使用：</strong>账号仅限本人使用。禁止任何形式的账号买卖、租借或恶意批量注册机器人账号。</li>
        </ul>

        <h2>二、内容发布红线</h2>
        <p>用户发布的所有内容（含帖子、私信、签名等）禁止包含：</p>
        <ul>
          <li><strong>法律底线：</strong>危害国家安全、泄露国家秘密、宣扬恐怖主义或极端主义的内容。</li>
          <li><strong>违禁物：</strong>严禁发布任何关于违禁武器改装、易燃易爆品制作教程等违法危险信息。</li>
          <li><strong>社区秩序：</strong>严禁地域歧视、人身攻击、挂人引战及恶意破坏他人名誉的行为。</li>
          <li><strong>商业行为：</strong>禁止发布未经官方授权的商业广告、私下交易链接及诱导性引流内容。</li>
        </ul>

        <h2>三、违规处理机制</h2>
        <p>平台管理团队有权视违规程度采取：<strong>内容隐藏、警告扣分、禁言（1-30天）、封禁IP或永久永久注销账号</strong>。涉及违法行为的，我们将依法上报监管部门。</p>
      </>
    )
  },

  // --- 3. 免责声明 ---
  'disclaimer': {
    title: 'CGBGEAR 免责声明',
    updated: '2026年2月17日',
    content: (
      <>
        <h2>一、信息存储空间说明</h2>
        <p>CGBGEAR 仅提供网络技术服务与信息存储空间。平台上所有由用户发布的内容仅代表发布者个人观点，不代表本平台立场。我们对内容的真实性、合法性、准确性不承担直接法律责任。</p>

        <h2>二、装备使用风险提示</h2>
        <p><strong>重要声明：</strong>本平台关于战术装备、户外器械、改造案例的讨论仅供技术交流参考。用户因参考平台内容进行的任何线下操作（如装备改装、极端环境使用等）所导致的设备损坏、人身伤害或财产损失，本平台不承担任何法律及赔偿责任。</p>

        <h2>三、不可抗力与安全免责</h2>
        <p>因地震、战争等不可抗力，或因黑客攻击、系统维护、运营商故障导致的数据丢失、访问中断，本平台在法律允许范围内予以免责。</p>
      </>
    )
  },

  // --- 4. 知识产权声明 ---
  'ip': {
    title: 'CGBGEAR 知识产权声明',
    updated: '2026年2月17日',
    content: (
      <>
        <h2>一、平台专有权利</h2>
        <p>CGBGEAR 的视觉设计、源代码、品牌 Logo、UI 界面、原创文章及数据库版权均归本平台所有。未经书面明确授权，严禁任何单位或个人进行镜像、抓取或二次开发。</p>

        <h2>二、用户内容授权</h2>
        <p>您在 CGBGEAR 发布的原创内容（如评测文章、实操图片），著作权归您本人所有。但<strong>在您发布内容时，即视为授予本平台在全球范围内免费的、永久的、非独家的使用许可</strong>，用于本平台的展示、推广、收录或官方渠道引用。</p>

        <h2>三、维权与举报</h2>
        <p>如您认为本平台内容侵犯了您的合法版权，请通过邮件方式提交权利证明。我们将在核实后的第一时间内配合处理。</p>
      </>
    )
  },

  // --- 5. 儿童隐私政策 ---
  'children-privacy': {
    title: 'CGBGEAR 儿童隐私政策',
    updated: '2026年2月17日',
    content: (
      <>
        <p>本平台主要面向成年战术装备爱好者，不主动针对 14 周岁以下的儿童提供服务。</p>
        <h2>一、监护人同意原则</h2>
        <p>若您是未成年人，请在监护人的陪同下阅读本政策。若您是监护人，请关注您被监护人是否在未经授权的情况下注册了账号。若发生此类情况，请通过邮件告知我们，我们将立即清理相关数据。</p>

        <h2>二、保护措施</h2>
        <p>对于经监护人同意收集的儿童个人信息，我们采取更高等级的安全加密，且严禁用于任何商业画像或定向营销。</p>
      </>
    )
  },

  // --- 6. 用户服务协议 ---
  'terms': {
    title: 'CGBGEAR 用户服务协议',
    updated: '2026年2月17日',
    content: (
      <>
        <p>欢迎使用 CGBGEAR 服务。本协议是您与 CGBGEAR 之间关于服务使用的法律约定。</p>
        <h2>一、协议生效</h2>
        <p>当您勾选“同意协议”并完成注册流程，或实际使用本平台服务时，即视为您已充分阅读、理解并接受本协议及隐私政策的全部内容。</p>
        <h2>二、服务变更</h2>
        <p>本平台有权根据业务发展需求，对服务内容进行调整、升级或中断，且不承担由此产生的违约责任。</p>
        <h2>三、争议解决</h2>
        <p>因本协议引起的任何争议，双方应友好协商解决；协商不成的，任何一方均有权向平台运营方所在地人民法院提起诉讼。</p>
      </>
    )
  },

  // --- 7. Cookie 政策 ---
  'cookies': {
    title: 'CGBGEAR Cookie 政策',
    updated: '2026年2月17日',
    content: (
      <>
        <p>为了优化您的访问体验并保障系统安全，我们会在您的设备中存储小型数据文件。</p>
        <h2>一、我们使用的技术</h2>
        <p>我们采用<strong>“身份验证标识”</strong>及<strong>“会话维持技术”</strong>。这些技术能够帮助我们在您跨页面浏览时识别您的登录身份，避免您在执行发布帖子或评论操作时重复输入密码。</p>
        
        <h2>二、技术使用的目的</h2>
        <ul>
          <li><strong>账户安全：</strong>通过这些技术识别异常登录环境，保护您的账户资产。</li>
          <li><strong>体验优化：</strong>记住您的偏好设置（如深色模式开关、界面语言等）。</li>
          <li><strong>流程简化：</strong>在交互过程中暂时缓存您的输入状态，防止因意外刷新导致的内容丢失。</li>
        </ul>

        <h2>三、您的控制权</h2>
        <p>您可以根据个人偏好在浏览器设置中清除所有本地缓存。但请注意，禁用这些必要技术后，您将无法正常登录使用本平台的核心互动功能。</p>
      </>
    )
  }
};

const PolicyPage = () => {
  const { type } = useParams();
  const data = POLICY_DATA[type];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type, data]);

  if (!data) {
    return (
      <div className="policy-page-wrapper">
        <MainNav navSolid={true} />
        <div className="policy-container"><h1>404 - Document Not Found</h1></div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="policy-page-wrapper">
      <MainNav navSolid={true} />
      
      <main className="policy-container">
        <header className="policy-header">
          <h1>{data.title}</h1>
          <div className="policy-info-box">
            <span>更新日期：{data.updated}</span>
            {data.effective && <span>生效日期：{data.effective}</span>}
          </div>
        </header>
        
        <article className="policy-content">
          {data.content}
        </article>

        {/* 统一的底部邮件联系区 */}
        <section className="policy-footer-contact">
          <h2 style={{marginTop: 0, fontSize: '18px', border: 'none'}}>联系我们</h2>
          <p>如果您对本政策或您的个人信息处理有任何疑问、意见或申诉，请通过以下官方邮箱联系我们的隐私保护团队：</p>
          <p>
            <a href={`mailto:${EMAIL_CONTACT}`} className="policy-email-link">
              {EMAIL_CONTACT}
            </a>
          </p>
          <p style={{fontSize: '13px', color: '#666', marginTop: '10px'}}>
            * 我们将在收到邮件后的 15 个工作日内完成身份核实并予以回复。
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default PolicyPage;
