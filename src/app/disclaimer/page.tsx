import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "免责声明 - Jenrych AI",
  description: "Jenrych AI 免责声明，了解使用AI服务的风险和限制。",
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">免责声明</h1>
          
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              生效日期：2024年1月1日<br />
              最后更新：2024年1月1日
            </p>

            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-8">
              <p className="text-red-800 dark:text-red-200 font-semibold">
                ⚠️ 重要提醒：请在使用Jenrych AI服务前仔细阅读本免责声明
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">1. AI技术限制</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Jenrych AI 基于人工智能技术，存在以下限制：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li><strong>准确性限制：</strong>AI生成的内容可能不准确、不完整或过时</li>
              <li><strong>理解限制：</strong>AI可能误解您的意图或上下文</li>
              <li><strong>偏见风险：</strong>AI可能包含训练数据中的偏见或错误观点</li>
              <li><strong>创造性限制：</strong>AI生成的内容可能缺乏人类创造力和判断力</li>
              <li><strong>实时性限制：</strong>AI可能无法获取最新的实时信息</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">2. 内容免责</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              关于AI生成的内容：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li><strong>仅供参考：</strong>所有AI生成的内容仅供参考，不构成专业建议</li>
              <li><strong>不保证准确性：</strong>我们不保证AI生成内容的准确性、完整性或适用性</li>
              <li><strong>用户判断：</strong>您应当自行判断内容的可信度和适用性</li>
              <li><strong>独立验证：</strong>重要决策前请咨询专业人士或进行独立验证</li>
              <li><strong>风险自担：</strong>基于AI内容做出的任何决定，风险由您自行承担</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">3. 专业建议免责</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Jenrych AI 不提供以下专业建议：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li><strong>医疗建议：</strong>不提供医疗诊断、治疗建议或健康咨询</li>
              <li><strong>法律建议：</strong>不提供法律意见、合同审查或诉讼建议</li>
              <li><strong>财务建议：</strong>不提供投资建议、财务规划或税务咨询</li>
              <li><strong>技术建议：</strong>不提供专业的技术实施或安全建议</li>
              <li><strong>教育建议：</strong>不替代专业的教育指导或学术咨询</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">4. 数据安全免责</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              关于数据安全：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li><strong>传输风险：</strong>数据传输过程中可能存在安全风险</li>
              <li><strong>存储风险：</strong>数据存储可能面临技术故障或安全威胁</li>
              <li><strong>第三方风险：</strong>第三方服务可能存在安全漏洞</li>
              <li><strong>用户责任：</strong>您有责任保护敏感信息，避免上传机密数据</li>
              <li><strong>技术限制：</strong>我们无法保证100%的数据安全</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">5. 服务中断免责</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们不对以下情况承担责任：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li><strong>技术故障：</strong>系统故障、服务器宕机或网络中断</li>
              <li><strong>维护升级：</strong>计划内的系统维护或功能升级</li>
              <li><strong>第三方问题：</strong>第三方服务提供商的问题</li>
              <li><strong>不可抗力：</strong>自然灾害、政府行为等不可抗力因素</li>
              <li><strong>用户行为：</strong>用户不当使用导致的服务问题</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">6. 第三方内容免责</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              关于第三方内容：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li><strong>不控制：</strong>我们不控制第三方网站或服务的内容</li>
              <li><strong>不负责：</strong>不对第三方内容的准确性或合法性负责</li>
              <li><strong>链接免责：</strong>外部链接仅供参考，不构成推荐</li>
              <li><strong>风险自担：</strong>访问第三方内容的风险由您自行承担</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">7. 知识产权免责</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              关于知识产权：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li><strong>无意侵权：</strong>我们无意侵犯任何第三方的知识产权</li>
              <li><strong>用户责任：</strong>您有责任确保上传内容不侵犯他人权利</li>
              <li><strong>及时处理：</strong>如收到侵权通知，我们将及时处理</li>
              <li><strong>免责保护：</strong>在合理范围内，我们享有免责保护</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">8. 使用风险</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              使用我们的服务可能面临以下风险：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li><strong>信息泄露：</strong>敏感信息可能被意外泄露</li>
              <li><strong>错误决策：</strong>基于AI内容做出错误决策</li>
              <li><strong>时间浪费：</strong>AI生成的内容可能不符合预期</li>
              <li><strong>依赖风险：</strong>过度依赖AI可能影响独立思考能力</li>
              <li><strong>技术风险：</strong>技术故障可能影响工作效率</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">9. 责任限制</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              在法律允许的最大范围内：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li><strong>不承担责任：</strong>我们不对任何直接、间接、特殊或后果性损害承担责任</li>
              <li><strong>责任上限：</strong>我们的总责任不超过您支付的服务费用</li>
              <li><strong>用户自担：</strong>所有使用风险由您自行承担</li>
              <li><strong>免责保护：</strong>在合理范围内，我们享有免责保护</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">10. 建议和提醒</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              为了安全使用我们的服务，建议您：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li><strong>谨慎使用：</strong>对AI生成的内容保持批判性思维</li>
              <li><strong>验证信息：</strong>重要信息请通过其他渠道验证</li>
              <li><strong>保护隐私：</strong>不要上传敏感或机密信息</li>
              <li><strong>专业咨询：</strong>重要决策请咨询相关专业人士</li>
              <li><strong>持续学习：</strong>保持对AI技术的了解和认识</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">11. 联系我们</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              如果您对本免责声明有任何疑问，请通过以下方式联系我们：
            </p>
            <ul className="list-none mb-6 text-gray-700 dark:text-gray-300">
              <li>邮箱：legal@jenrychai.com</li>
              <li>地址：中国北京市朝阳区</li>
              <li>电话：400-123-4567</li>
            </ul>

            <div className="mt-8 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                <strong>最后提醒：</strong>本免责声明是您使用Jenrych AI服务的重要法律文件。
                使用我们的服务即表示您已阅读、理解并同意本免责声明的所有条款。
                如果您不同意任何条款，请立即停止使用我们的服务。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
