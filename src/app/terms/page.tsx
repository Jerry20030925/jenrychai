import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "服务条款 - Jenrych AI",
  description: "Jenrych AI 服务条款，了解使用我们服务的条款和条件。",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">服务条款</h1>
          
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              生效日期：2024年1月1日<br />
              最后更新：2024年1月1日
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">1. 服务描述</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Jenrych AI 是一个基于人工智能的对话平台，提供以下服务：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>智能对话和问答服务</li>
              <li>多模态内容分析（图片、视频、文档等）</li>
              <li>语义搜索和内容推荐</li>
              <li>个性化AI助手功能</li>
              <li>其他相关AI服务</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">2. 用户责任</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              使用我们的服务时，您同意：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>提供真实、准确的注册信息</li>
              <li>保护您的账户安全，不得与他人共享账户</li>
              <li>不得使用服务进行非法活动或违反法律法规</li>
              <li>不得上传、传输或分享有害、威胁、诽谤、淫秽或其他不当内容</li>
              <li>不得尝试破解、逆向工程或干扰我们的系统</li>
              <li>尊重其他用户的权利和隐私</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">3. 禁止行为</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              以下行为被严格禁止：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>发布虚假、误导性或欺骗性信息</li>
              <li>传播恶意软件、病毒或其他有害代码</li>
              <li>进行垃圾邮件、钓鱼或其他形式的网络攻击</li>
              <li>侵犯他人知识产权、隐私权或其他权利</li>
              <li>进行商业间谍活动或竞争情报收集</li>
              <li>利用服务进行任何形式的欺诈活动</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">4. 内容政策</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              关于您上传或生成的内容：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>您保留对您上传内容的权利</li>
              <li>您授权我们使用内容来提供和改进服务</li>
              <li>我们有权删除违反政策的内容</li>
              <li>AI生成的内容仅供参考，不构成专业建议</li>
              <li>您对使用AI生成内容承担全部责任</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">5. 服务可用性</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们努力保持服务的稳定运行，但不保证：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>服务将始终可用或不受中断</li>
              <li>服务将满足您的特定需求</li>
              <li>服务将完全无错误或缺陷</li>
              <li>数据传输将完全安全</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">6. 知识产权</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              知识产权保护：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>我们的服务、软件和内容受知识产权法保护</li>
              <li>您不得复制、修改、分发或创建衍生作品</li>
              <li>我们的商标、标识和品牌受法律保护</li>
              <li>第三方内容的使用需遵守相应许可条款</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">7. 隐私保护</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们重视您的隐私：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>我们按照隐私政策处理您的个人信息</li>
              <li>我们不会出售您的个人信息给第三方</li>
              <li>我们采用行业标准的安全措施保护数据</li>
              <li>您有权控制您的个人信息</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">8. 服务变更和终止</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们保留以下权利：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>随时修改、暂停或终止服务</li>
              <li>更新服务功能和界面</li>
              <li>因违反条款而暂停或终止用户账户</li>
              <li>因技术或商业原因停止服务</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">9. 免责声明</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              服务按"现状"提供，我们不承担以下责任：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>服务中断、延迟或错误造成的损失</li>
              <li>AI生成内容的准确性或适用性</li>
              <li>用户行为造成的任何损害</li>
              <li>第三方服务或内容的问题</li>
              <li>数据丢失或泄露（除非由我们的重大过失造成）</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">10. 责任限制</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              在法律允许的最大范围内：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>我们的总责任不超过您在过去12个月内支付的服务费用</li>
              <li>我们不承担间接、特殊、偶然或后果性损害</li>
              <li>我们不承担利润损失、数据丢失或业务中断的损害</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">11. 争议解决</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              争议解决方式：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>首先通过友好协商解决争议</li>
              <li>协商不成时，提交有管辖权的人民法院解决</li>
              <li>适用中华人民共和国法律</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">12. 条款修改</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们可能会不时修改本服务条款：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>重大修改将通过电子邮件或网站通知</li>
              <li>继续使用服务即表示接受修改后的条款</li>
              <li>如不同意修改，请停止使用服务</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">13. 联系我们</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              如果您对本服务条款有任何疑问，请通过以下方式联系我们：
            </p>
            <ul className="list-none mb-6 text-gray-700 dark:text-gray-300">
              <li>邮箱：legal@jenrychai.com</li>
              <li>地址：中国北京市朝阳区</li>
              <li>电话：400-123-4567</li>
            </ul>

            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>重要提醒：</strong>请仔细阅读本服务条款。使用我们的服务即表示您同意遵守这些条款。
                如果您不同意任何条款，请不要使用我们的服务。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
