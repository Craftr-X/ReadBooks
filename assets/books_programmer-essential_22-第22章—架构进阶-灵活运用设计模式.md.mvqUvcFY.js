import{_ as a,o as i,c as n,a3 as p}from"./chunks/framework.DdpBa4_E.js";const c=JSON.parse('{"title":"","description":"","frontmatter":{},"headers":[],"relativePath":"books/programmer-essential/22-第22章—架构进阶-灵活运用设计模式.md","filePath":"books/programmer-essential/22-第22章—架构进阶-灵活运用设计模式.md","lastUpdated":1794316978000}'),l={name:"books/programmer-essential/22-第22章—架构进阶-灵活运用设计模式.md"};function e(h,s,t,k,r,d){return i(),n("div",null,[...s[0]||(s[0]=[p(`<p>上一章中，我们从宏观层面了解了六大设计原则，设计原则是总纲，设计模式就是具体的实现。</p><p>那么，本章我们就来深入了解下常见的设计模式，来看一看设计原则是怎么具像化的。</p><h2 id="单例模式" tabindex="-1">单例模式 <a class="header-anchor" href="#单例模式" aria-label="Permalink to &quot;单例模式&quot;">​</a></h2><blockquote><p>只有一个对象。</p></blockquote><p>在 LOL 中，你可以不会其他英雄，但是不能不会盖伦；在算法界，你可以不会其他算法，但是不能不会冒泡排序；在设计模式界，你可以不会其他的设计模式，但是不能不会单例模式。</p><p>这说明它重要吗？</p><p>不！这说明它段位低。</p><p>所以我们要先把它干掉来摆脱低段位，从而进入高分局。</p><p>单例单例，单一的实例，所以单例模式的目的只有一个：<strong>只有一个对象</strong>。</p><p>那这个简单啊，我就创建一个对象保存起来，下次来取的时候，如果对象已经创建了，直接返回这个对象就行。</p><div class="language-java vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">java</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">public</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> SingleInstance {</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    // 定义一个对象</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    private</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> static</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> SingleInstance instance;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    </span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    // 获取对象</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    public</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> static</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> SingleInstance</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">() {</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">        // 如果对象为null就创建，否则直接返回 </span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">        if</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(instance </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">==</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> null</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            instance </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> SingleInstance</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        }</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">        // 返回</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">        return</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> instance;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    </span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    // 构造函数私有化</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    private</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> SingleInstance</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(){}</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br></div></div><p>首先我们要把构造函数私有化，不然其他地方能随便<code>new</code>出来了，就不是单例了。那么既然私有化了，别的地方没法<code>new</code>出来，也就没法访问成员函数，所以只能访问静态函数，所以我们要提供一个静态函数来返回单例对象，所以，单例也要声明为静态的，因为静态函数只能使用静态变量。</p><p>完事了吗？</p><p>当然没有。</p><p>上述代码在单线程中完全 OK。但是，免不了有多线程的情况啊，比如，两个线程 A、B 同时跑到：</p><div class="language-java vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">java</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">if</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(istance </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">==</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> null</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    instance </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> SingleInstance</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br></div></div><p>按照我们<a href="https://juejin.cn/book/7196580339181944872/section/7196591134489968692" target="_blank" rel="noreferrer">第 14 章</a>讲的，A 和 B 分别把<code>instance</code>读入自己的缓存，然后判断都为 null，然后各自执行<code>instance = new SingleInstance();</code>，此时，已经不是单例了，已经创建两个了。</p><p>所以说，上述代码不够完美，那我们要修改一下，我们的问题不再是单例怎么写了，而是怎么避免多线程了。</p><p>很简答，排队啊，加锁啊，加锁就是<code>synchronized</code>呗。</p><pre><code>public SingleInstance {
    // 定义一个对象
    private static SingleInstance instance;
    
    // 获取对象，加锁
    public static syncnronized SingleInstance() {
        // 如果对象为null就创建，否则直接返回 
        if(instance == null) {
            instance = new SingleInstance();
        }
        // 返回
        return instance;
    }
    
    // 构造函数私有化
    private SingleInstance(){}
}
</code></pre><p>这下就线程安全了。</p><p>但是，我们前面说过，<code>synchronized</code>是悲观锁，效率偏低。其实我们仔细想想，加锁是为了避免多个线程同时创建对象，那就是说：如果不创建对象，就不需要加锁；而创建对象的前提是对象为 null 了。那不就意味着：如果对象不为 null，就不需要创建对象，也就不需要加锁吗？</p><p>没错，那我们就来改下：</p><pre><code>public SingleInstance {
    // 定义一个对象
    private static SingleInstance instance;
    
    // 获取对象
    public static SingleInstance() {
        // 如果对象为null就创建，否则直接返回 
        if(instance == null) {
            // 锁放这里了
            synchronized(SingleInstance.class) {
                instance = new SingleInstance();
            }
        }
        // 返回
        return instance;
    }
    
    // 构造函数私有化
    private SingleInstance(){}
}
</code></pre><p>现在我们的锁放在<code>if</code>内了，也就是意味着如果<code>instance</code>为 null 才会加锁，这样就不会出现白加锁的情况了，从而提高效率。</p><p>唉，又出问题了。</p><p>假如还是 A 和 B 俩线程，同时走到了<code>if(instance == null)</code>，发现为 null，于是都进入<code>if</code>块内，A 先执行，把对象创建出来，执行完后 B 再执行，<strong>B 执行的时候并没有再次去判断<code>instance</code>是否为 null</strong>，而是直接去创建。于是，又创建了俩对象，干！</p><p>愁死了，那何以解忧呢？</p><p>其实我们也分析到了，<strong>轮到 B 执行的时候，B 没有再次去判断<code>instance</code>是否为 null</strong>，那就再判断一次就行了。</p><p>所以，我们的最终代码变成了：</p><pre><code>public SingleInstance {
    // 定义一个对象，加volatile，保证内存可见性。
    private static volatile SingleInstance instance;
    
    // 获取对象
    public static SingleInstance() {
        // 如果对象为null就创建，否则直接返回 
        if(instance == null) {
            // 锁放这里了
            synchronized(SingleInstance.class) {
                if(instance == null) {
                    instance = new SingleInstance();
                }
            }
        }
        // 返回
        return instance;
    }
    
    // 构造函数私有化
    private SingleInstance(){}
}
</code></pre><p>我们发现，我们一共做了两次判空处理，也就是做了两次检测（Double Check），并且加了一次锁（Lock），所以，我们就叫它：DCL 单例（Double Check Lock）。</p><p>我们上面的代码中，<code>instance</code>变量需要用<code>volatile</code>修饰下，从而来保证内存可见性，这个属于语言层面的东西，这里不再废话。</p><p>当然，单例还有很多其他方法的写法，据我所知就有 7 种（别卷了！），其实，万变不离其宗，只要你满足<strong>单一的对象</strong>，就足矣。</p><p>那么，单例有啥用呢？为啥要写单例？</p><p>比方说，我做了一个 App，我登录 App 后，我的信息全局是不是只能有一份儿？</p><p>再比如说，我做了个直播间 App，我是不是同时只能进入一个直播间？</p><p>那么我们找共性：只能有一个！</p><p>所以就叫单例。</p><p>或者你可以后发制人，你先不写单例，等到测试提 Bug 了：你这同时出俩数据，你这同时进俩直播间，等等。</p><p>此时就可以考虑单例了。</p><h2 id="观察者模式" tabindex="-1">观察者模式 <a class="header-anchor" href="#观察者模式" aria-label="Permalink to &quot;观察者模式&quot;">​</a></h2><blockquote><p>给我联系方式，我完事了通知你。</p></blockquote><p>观察者模式是用得最多的了，很多响应式编程，都是用观察者模式实现的。</p><p>观察者模式的核心就是：A 发生了什么事，就告诉 B。这样 B 就能实时得知 A 的变化，就像 B 一直在观察着 A 似的，其中A就叫做被观察者，B就叫做观察者。</p><p>我们来看代码：</p><div class="language-java vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">java</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 定义一个观察者</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">interface</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> Observer</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    // 定义一个通知方法 </span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    void</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> notify</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(String </span><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">msg</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br></div></div><div class="language-java vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">java</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 定义一个被观察者</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">class</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> BeObserver</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    // 定义观察者集合</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    private</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> List&lt;</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">Observer</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">&gt; observers </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> ArrayList</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    </span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    // 添加观察者</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    public</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> void</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> addObserver</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(Observer </span><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">observer</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">        if</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(observers.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">contains</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(observer)) </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">return</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        observers.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">add</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(observer);</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    </span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    // 移除观察者</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    public</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> void</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> removeObserver</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(Observer </span><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">observer</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        observers.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">remove</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(observer);</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    </span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    // 自己发生变动</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    private</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> void</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> selfChange</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">() {</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">        // 通知观察者</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        observers.forEach {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            it.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">notify</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;寡人改变了，通知你一下&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">);</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br><span class="line-number">21</span><br><span class="line-number">22</span><br><span class="line-number">23</span><br><span class="line-number">24</span><br></div></div><p>我们的代码很简单，说白了就是：</p><ol><li>定义观察者和被观察者；</li><li>观察者需要提供联系方式给被观察者，用于被观察者变动时通知自己；</li><li>联系方式就是添加观察者<code>addObserver()</code>；</li><li>当被观察者发生变动时，就用观察者的联系方式通知它，也就是<code>observer.noitfy()</code>方法。</li></ol><p>其实说白了就是：<strong>你把你给我，我发生了改变就调你的方法</strong>。</p><p>因为，“你把你给我”就意味着我要持有你，这明显就是耦合了，可能发生内存泄漏，所以我们要提供一个<strong>你把你移除</strong>的方法，也就是移除观察者<code>removeObserver()</code>方法，用来在不需要的时候移除掉观察者。</p><p>在写观察者模式的时候，我们一定要注意<strong>最少知识原则</strong>和<strong>依赖倒置原则</strong>，我们的观察者模式尽量定义成接口，并且一定要缩小范围，这样方便拓展。比如，我只需要一个通知功能，你却为了省事把对象整个传递进去了：</p><pre><code>// 观察者定义成了对象，而且有很多没用的方法
class Teacher {
    public void notify(String msg){
    }
    
    public void teach() {
    }
    
    public void write() {
    }
}

class Student {
    // 添加观察者，直接传递了具体的对象：Teacher
    public void addObserver(Teacher observer) {
        if(observers.contains(observer)) return;
        observers.add(observer);
    }
    
    // 自己发生变动
    private void selfChange() {
        // 通知观察者，只需要用到notify()方法
        observers.forEach {
            it.notify(&quot;寡人改变了，通知你一下&quot;);
        }
    }
}
</code></pre><p>示例代码中，首先把观察者定义成了具体对象，而且里面有三个方法，但是我们的被观察者只需要调用<code>notify()</code>就足够了，不需要知道其他的方法，这违背了<strong>最少知识原则</strong>；其次，被观察者的<code>addObserver()</code>中，依赖了具体对象，而不是接口，这就意味着不好拓展，万一将来需要让校长、班长也可以观察呢？这违背了<strong>依赖倒置原则</strong>，所以我们需要改一下代码，改成如下的即可：</p><pre><code>// 定义观察者
interface Observer {
    public void notify(String msg){
    }
}

// 老师实现观察者接口就行了
class Teacher implements Observer{
    public void notify(String msg){
    }
    
    public void teach() {
    }
    
    public void write() {
    }
}

class Student {
    // 添加观察者，传递接口
    public void addObserver(Observer observer) {
        if(observers.contains(observer)) return;
        observers.add(observer);
    }
    
    // 自己发生变动
    private void selfChange() {
        // 通知观察者，只需要用到notify()方法
        observers.forEach {
            it.notify(&quot;寡人改变了，通知你一下&quot;);
        }
    }
}
</code></pre><p>仅仅需要抽离出一个接口，把需要用到什么函数定义到接口里面即可，将来校长、班长也想观察，直接实现接口即可，是不是更 <strong>OCP</strong> 了？</p><p>你看，这一点改动，差距立刻出来了。</p><p>那观察者模式有啥用呢？</p><p>比如说：A 页面需要知道 B 页面上的一个按钮是否被点击，点击了之后自己就要刷新；再比如：A 页面上弹出了编辑框，编辑的时候 A 页面要跟着编辑的内容更新。</p><p>有人就说了：那这不就等于被观察者需要持有观察者吗？听着怎么有点别扭啊。</p><p>非也非也，不是被观察者持有观察者，而是被观察者持有观察者的函数，以此来通知观察者。</p><p>所以，观察者模式也叫做<strong>订阅-发布模式</strong>，观察者就是订阅者，被观察者就是发布者，发布者一旦发生变动，就通知订阅者，所以需要订阅者的联系方式，也就等价于持有订阅者的函数，所以就是：被观察者持有观察者的函数。</p><p><strong>凡是需要实时了解其他地方的变动的，都可以用观察者模式</strong>。</p><h2 id="责任链模式" tabindex="-1">责任链模式 <a class="header-anchor" href="#责任链模式" aria-label="Permalink to &quot;责任链模式&quot;">​</a></h2><blockquote><p>沿着链路不断传递，直到有一个节点处理为止。</p></blockquote><p>这个很好理解：老板派发了一个任务，先发给部门主管，部门主管觉得自己不想处理，就向下派发给小组长，小组长想处理就处理了，不想处理就派发给员工处理，最后把事情处理掉。</p><p>核心就是一个：<strong>在一个链上把问题解决掉</strong>。</p><p>定义抽象事件处理者：</p><div class="language-java vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">java</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">interface</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> EventHandler</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    // 处理事件，返回值表示是否处理成功</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    boolean</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> handleEvent</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br></div></div><p>定义具体的事件处理者：</p><div class="language-java vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">java</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 老板</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">class</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> Boss</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> implements</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> EventHandler</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 主管</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">class</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> Manager</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> implements</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> EventHandler</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 小组长</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">class</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> Leader</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> implements</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> EventHandler</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 员工</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">class</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> Staff</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> implements</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> EventHandler</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br></div></div><p>使用：</p><div class="language-java vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">java</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 定义责任链</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">List&lt;</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">EventHandler</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">&gt; handlers </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> ArrayList</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 添加事件处理者</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">handlers.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">add</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> Boss</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">());</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">handlers.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">add</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> Manager</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">());</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">handlers.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">add</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> Leader</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">());</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">handlers.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">add</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> Staff</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">());</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 处理事件</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">for</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(EventHandler handler </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">:</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> handlers) {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    if</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(handler.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">handleEvent</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">()) </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">return</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br></div></div><p>可以看到，我们遍历<code>handlers</code>来处理事件，如果前面的人已经把事情处理了，就会直接返回，那么后面的就不用处理了；如果前面的没处理，那么就沿着这个链继续向下分发，最终把事情处理掉。</p><p>有人说，如果都不处理呢？</p><p>都不处理就出 Bug 了。所以，最后一个处理者一定是兜底的，一定要保证能把问题解决掉，所以，我们的事件处理者是有优先级的，效率高的排在前面，效率低的排在后面，但是最后面的一定是能把问题解决的。</p><p>道理我都懂了，这有啥用呢？</p><p>记忆这么差啊，我们<a href="https://juejin.cn/book/7196580339181944872/section/7196591549017243700" target="_blank" rel="noreferrer">第 18 章</a>刚讲过的缓存，不就是责任链模式吗？当初我们是这么写的：</p><pre><code>// 从内存中获取数据
if(data != null) return data;
// 如果数据为空，就从本地缓存中获取数据
data = getLocalData();
if(data != null) return data;
// 如果数据为空，就从网络获取数据 
String newData = requestData();
</code></pre><p>也就是说，我们获取数据的顺序是：内存 -&gt; 本地 -&gt; 网络。</p><p>这不就是责任链吗？</p><p>我们就来改一下这个代码，让它更有段位：</p><div class="language-java vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">java</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 定义一个缓存处理器</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">interface</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> ICache</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    String </span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">getData</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();    </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    </span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    void</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> cacheData</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(String </span><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">data</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">);</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br></div></div><p>然后来实现不同的缓存：</p><div class="language-java vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">java</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 内存缓存</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">class</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> MemoryCache</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> implements</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> ICache</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    // 保存的数据</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    private</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> String data;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    </span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    public</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> String </span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">getData</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">() {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">        return</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> data;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    </span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    public</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> void</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> cacheData</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(String </span><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">data</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) {</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">        this</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.data </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> data;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 本地缓存</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">class</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> LocalCache</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> implements</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> ICache</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    // 这里就是读取本地文件，细节忽略</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    public</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> String </span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">getData</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">() {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">        return</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> getLocalData</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    </span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    // 保存到本地文件</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    public</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> void</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> cacheData</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(String </span><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">data</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) {</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">        this</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.data </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> data;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 网络缓存</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">class</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> NetCache</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> implements</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> ICache</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    // 这里可以用异步函数或者挂起操作</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    public</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> String </span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">getData</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">() {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">        return</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> getNetWorkData</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    </span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    public</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> void</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> cacheData</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(String </span><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">data</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) {</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">        // 空实现即可</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br><span class="line-number">21</span><br><span class="line-number">22</span><br><span class="line-number">23</span><br><span class="line-number">24</span><br><span class="line-number">25</span><br><span class="line-number">26</span><br><span class="line-number">27</span><br><span class="line-number">28</span><br><span class="line-number">29</span><br><span class="line-number">30</span><br><span class="line-number">31</span><br><span class="line-number">32</span><br><span class="line-number">33</span><br><span class="line-number">34</span><br><span class="line-number">35</span><br><span class="line-number">36</span><br><span class="line-number">37</span><br><span class="line-number">38</span><br></div></div><p>然后就可以使用：</p><div class="language-java vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">java</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">List&lt;</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">ICache</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">&gt; caches </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> ArrayList</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">caches.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">add</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> MemoryCache</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">());</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">caches.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">add</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> LocalCache</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">());</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">caches.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">add</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> NetCache</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">());</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 获取数据</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">String </span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">getData</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">() {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    String data;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    for</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(ICache cache in caches) {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        data </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> cache.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">getData</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">        if</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">!</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">data </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">==</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> null</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">return</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> data;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 保存数据</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">void</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> saveData</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(String data) {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    for</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(ICache cache in caches) {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">       cache.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">cacheData</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(data);</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br><span class="line-number">21</span><br></div></div><p>是不是很方便了？我们按照“<strong>内存缓存&gt;本地缓存&gt;网络缓存</strong>”这个优先级组成一个责任链，获取数据的时候，按照优先级来获取，如果前面的返回了数据，后面的就不需要执行了，并且保存数据也很简单，而且代码容易拓展了，如果将来有一天，我们有个新的缓存，就可以直接加在适当的位置，而不用改其他任何地方的代码。</p><p>有人说，你这个网络缓存不需要保存数据啊，那就不应该实现<code>ICache</code>接口，或者应该将<code>ICache</code>接口拆分成两个，一个获取数据，一个保存数据，这样才满足<strong>接口隔离原则</strong>。</p><p>完全正确！给你点赞。</p><p>只不过我偷懒了而已，这个任务就交给你去实现了。</p><h2 id="总结" tabindex="-1">总结 <a class="header-anchor" href="#总结" aria-label="Permalink to &quot;总结&quot;">​</a></h2><p>本章就到此结束了，我们本章重点讲了 3 个设计模式。</p><ul><li><strong>单例模式</strong>：保证只有一个对象，要注意多线程环境下的单例问题。</li><li><strong>观察者模式</strong>：被观察者的变动可以实时通知给观察者，要注意观察者要满足最少知识原则。</li><li><strong>责任链模式</strong>：将事件沿着责任链分发，直到事件被处理为止。</li></ul><p>其实，设计模式有很多，10 篇文章都讲不完。但是我们可以看到，<strong>设计模式都是由设计原则衍生出来的</strong>，也就是说，本来是没有设计模式的，写得多了，就觉得这样的场景太多，于是就把这个场景抽离出来，就成了设计模式，于是就有各种不同的设计模式，最后又发现，这些设计模式都要满足几条规则，也就是设计原则。我们要学，肯定是要学“根”，而不是学“枝叶”，有没有比设计原则更&quot;根&quot;的知识呢？</p><p>有，<code>设计思想</code>，那么，下一章，我们就脱离设计模式，上升到设计思想的角度来看问题。</p>`,97)])])}const g=a(l,[["render",e]]);export{c as __pageData,g as default};
