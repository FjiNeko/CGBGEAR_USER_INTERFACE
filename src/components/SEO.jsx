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
import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, image }) => {
    const siteName = "CGBGEAR";
    const fullSiteTitle = "CGBGEAR - 国内原创战术尼龙装备与造型交流平台";

    const defaultDesc = "CGBGEAR是国内原创战术装备品牌，主打实战导向的军警及民用战术尼龙装备（）。同时打造专业的造型交流社区，提供装备评测、造型上传与搭配工具，服务于军警、安保、军迷及户外群体。";

    const defaultKeywords = [
        "CGBGEAR",
        "CGB Gear",
        "TACCGB",
        "CGBGEAR TACTICAL",
        "战术装备",
        "尼龙装备",
        "原创战术品牌",
        "国内原创战术品牌",
        "军警装备造型论坛",
        "战术附件",
        "电台通讯",
        "发射器配件",
        "军警造型",
        "战术背心",
        "战术导航板",
        "战术附包",
        "战术尼龙社区",
        "军警尼龙社区",
        "CGB论坛",
        "战术交流官网",
        "战术交流社区",
        "聚焦战术尼龙",
        "枪套",
        "军迷社区",
        "实战导向",
        "腰封",
        "头盔附件",
        "魔术贴",
        "士气章",
        "战术护目镜",
        "腰带配件",
        "战术手电",
        "军潮系列",
        "我们做装备",
        "也和玩家一起",
        "讲好每一个故事"
    ].join(", ");

    // --- 修改处：更新默认分享图为 favicon.ico ---
    const defaultImage = "https://img.cgbgear.cn/favicon.ico";

    const pageTitle = title ? `${title} | ${siteName}` : fullSiteTitle;

    return (
        <Helmet>
            <title>{pageTitle}</title>
            <meta name="description" content={description || defaultDesc} />
            <meta name="keywords" content={keywords || defaultKeywords} />

            {/* Social Media / Open Graph */}
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="CGBGEAR 战术装备平台" />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={description || defaultDesc} />

            {/* 
         注意：此处使用了 .ico 文件作为分享图。
         如果将来发现微信/QQ分享时图片不显示或太模糊，建议换成大尺寸的 PNG/JPG 格式 Logo 
      */}
            <meta property="og:image" content={image || defaultImage} />

            {/* 移动端优化 */}
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Helmet>
    );
};

export default SEO;
