import{_ as s,o as a,c as p,a3 as e}from"./chunks/framework.DdpBa4_E.js";const o=JSON.parse('{"title":"","description":"","frontmatter":{},"headers":[],"relativePath":"books/programmer-essential/11-第11章—数据结构进阶-实现原理和设计思路.md","filePath":"books/programmer-essential/11-第11章—数据结构进阶-实现原理和设计思路.md","lastUpdated":1794316978000}'),l={name:"books/programmer-essential/11-第11章—数据结构进阶-实现原理和设计思路.md"};function i(r,n,c,b,t,u){return a(),p("div",null,[...n[0]||(n[0]=[e(`<p>在上一章，我们居高临下地俯瞰了数据结构的基本特性，不过都是一些概念性的东西，我们并没有涉及到具体的编码，那么，这一章我们就从根儿上来拆解下数据结构的设计原理。</p><p>在上一章中，我们讲到：<strong>线性数据结构之间的元素是一对一的</strong>。并且我们知道它分为顺序表和链表，<strong>而顺序表要求元素之间要互相挨着</strong>，这好像是<a href="https://juejin.cn/book/7196580339181944872/section/7196589257459236904" target="_blank" rel="noreferrer">第 4 章</a>中我们讲过的数组啊，数组不正是这个特性吗？</p><p>那岂不是直接拿着数组就能当顺序表用吗？</p><p>嗯，差不多了，那顺序表肯定就是用数组实现的，我们就来设计下。</p><h2 id="顺序表" tabindex="-1">顺序表 <a class="header-anchor" href="#顺序表" aria-label="Permalink to &quot;顺序表&quot;">​</a></h2><p>数组是具体的数据类型，顺序表只是个抽象的概念，那我们就用数组这个具体的类型来实现顺序表这个抽象概念。</p><p>我们知道，对于数组来说，访问、修改元素，都是通过下标实现的，比如：</p><div class="language-text vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>int[] arr;</span></span>
<span class="line"><span>// 访问</span></span>
<span class="line"><span>int a = arr[i];</span></span>
<span class="line"><span>// 修改</span></span>
<span class="line"><span>arr[i] = 10;</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br></div></div><p>这极其不方便，寡人不关心你的下标是多少，我只想往里放，从里取，然后传个下标就给我返回对应的元素，这样行吗？</p><p>可以！那么，怎么实现呢？</p><p>很简单，我们就用数组，然后根据下标<code>index</code>去操作元素，存放元素的时候就让<code>index+1</code>，取元素的时候就让<code>index-1</code>，访问指定下标元素的时候，直接返回<code>index</code>对应的元素就行。</p><p>上代码：</p><div class="language-text vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>// 名字就先这么委屈地叫着吧</span></span>
<span class="line"><span>class XianxingBiao {</span></span>
<span class="line"><span>    // 初始化一个大小为10的数组 </span></span>
<span class="line"><span>    private int[] arr = new int[10]();</span></span>
<span class="line"><span>    // 当前元素的下标，默认是没有的，所以就是-1</span></span>
<span class="line"><span>    privage int curIndex = -1;</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    // 存放元素</span></span>
<span class="line"><span>    public void put(int num) {</span></span>
<span class="line"><span>        // 下标+1，然后再存放元素</span></span>
<span class="line"><span>        arr[++curIndex] = a;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    // 获取元素，可能会下标越界，直接返回，效率好高</span></span>
<span class="line"><span>    public int get(int index) {</span></span>
<span class="line"><span>        return arr[index];</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    // 在指定位置插入元素，效率好低啊</span></span>
<span class="line"><span>    public int add(int num, int index) {</span></span>
<span class="line"><span>        // 我们前面讲过了，需要将index以及后面的元素全部往后挪一步</span></span>
<span class="line"><span>        </span></span>
<span class="line"><span>        // 第一步，先把index以及后面的元素挪一步，我们要从后往前开始，因为前面的移动会覆盖后面的</span></span>
<span class="line"><span>        for(int i = arr.length-1; i &gt; index; i--) {</span></span>
<span class="line"><span>            arr[i] = arr[i-1];</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>        </span></span>
<span class="line"><span>        // 第二步，上面已经把arr[index]空出来了，那就直接放新值就行</span></span>
<span class="line"><span>        arr[index] = num;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    // 删除指定位置的元素，效率好低啊</span></span>
<span class="line"><span>    public void remove(int index){</span></span>
<span class="line"><span>        // 我们前面讲过了，需要将index后面的元素全部往前挪一步</span></span>
<span class="line"><span>        </span></span>
<span class="line"><span>        // 这里的需要从index开始，因为后面的移动会覆盖前面的</span></span>
<span class="line"><span>        for(int i = index; i &lt;= arr.length-2;i++) {</span></span>
<span class="line"><span>            arr[i] = arr[i+1];</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br><span class="line-number">21</span><br><span class="line-number">22</span><br><span class="line-number">23</span><br><span class="line-number">24</span><br><span class="line-number">25</span><br><span class="line-number">26</span><br><span class="line-number">27</span><br><span class="line-number">28</span><br><span class="line-number">29</span><br><span class="line-number">30</span><br><span class="line-number">31</span><br><span class="line-number">32</span><br><span class="line-number">33</span><br><span class="line-number">34</span><br><span class="line-number">35</span><br><span class="line-number">36</span><br><span class="line-number">37</span><br><span class="line-number">38</span><br><span class="line-number">39</span><br><span class="line-number">40</span><br><span class="line-number">41</span><br><span class="line-number">42</span><br></div></div><p>有人说，添加元素是两步，删除元素为啥是一步呢？不应该先把那个位置空出来，然后再把后面元素往前挪移吗？</p><p>不用！你直接挪移元素，后面的就会把<code>index</code>位置的覆盖了，那不就等于删除了吗？何必多此一举呢。</p><p>还有问题啊，上面的数组，创建的时候大小是 10，添加元素或者插入元素的时候，如果放不下，怎么办呢？</p><p>扩容！我们在<a href="https://juejin.cn/book/7196580339181944872/section/7196588835345465384" target="_blank" rel="noreferrer">第 5 章</a>也讲过，要<strong>尽量选择易变的数据结构</strong>，那么我们设计的也肯定要这样。<a href="https://juejin.cn/book/7196580339181944872/section/7196589257459236904" target="_blank" rel="noreferrer">第 4 章</a>我们也说了，数组的扩容很费劲，究竟有多费劲呢？就是只能新建一个大的，把老的挨个复制进去，这性能确实酸爽。</p><p>我们来看扩容的代码：</p><div class="language-text vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>class XianxingBiao {</span></span>
<span class="line"><span>    // 初始化一个大小为10的数组 </span></span>
<span class="line"><span>    private int[] arr = new int[10]();</span></span>
<span class="line"><span>    // 当前元素的下标，默认是没有的，所以就是-1</span></span>
<span class="line"><span>    privage int curIndex = -1;</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    // 扩容</span></span>
<span class="line"><span>    private void resize() {</span></span>
<span class="line"><span>        // 还记得左移吗，就是乘以2，也就是新的数组大小是老的2倍，就是20</span></span>
<span class="line"><span>        int newSize = arr.length &lt;&lt; 1;</span></span>
<span class="line"><span>        int[] newArray = new int[newSize];</span></span>
<span class="line"><span>        </span></span>
<span class="line"><span>        // 把老数组元素挨个拷贝到新数组中</span></span>
<span class="line"><span>        for(int i = 0; i &lt; arr.length; i++) {</span></span>
<span class="line"><span>            newArray[i] = arr[i];</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>        </span></span>
<span class="line"><span>        // 还记得吗？数组是个对象，对象是个引用，改变引用的值就是改变指向的对象</span></span>
<span class="line"><span>        arr = newArray();</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br><span class="line-number">21</span><br></div></div><p>上述我们创建一个新数组，将老数组元素按顺序拷贝过去，然后将新数组赋值给老数组，这样，老数组就完成了扩容，简单粗暴。</p><p>那么，我们在 <code>put()</code>和<code>add()</code>之前，就要先检查下是否能存放下，如果存放不下，那么就先扩容。如下：</p><div class="language-text vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>class XianxingBiao {</span></span>
<span class="line"><span>     // 存放元素</span></span>
<span class="line"><span>    public void put(int num) {</span></span>
<span class="line"><span>        // 如果当前元素已经到头了，就是没位置了，就要扩容</span></span>
<span class="line"><span>        if(curIndex == arr.length-1) {</span></span>
<span class="line"><span>            resize();</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>        ...其他代码</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    // 在指定位置插入元素</span></span>
<span class="line"><span>    public int add(int num, int index) {</span></span>
<span class="line"><span>        // 如果当前元素已经到头了，就是没位置了，就要扩容</span></span>
<span class="line"><span>        if(curIndex == arr.length-1) {</span></span>
<span class="line"><span>            resize();</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>        ...其他代码</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br></div></div><p>好，这样我们就解决了“<strong>我们的顺序表不是易变的数据结构</strong>”这个问题。</p><p>这实现是实现了，不过这拷贝一份儿，这效率也太低了。嗯，你可以将数组的初始容量变大一些，但是这样就可能浪费空间；所以，你要考虑你的需求场景，如果是数据量很大的，就不妨将数组初始容量改大一些，避免频繁扩容带来的开销；如果数据量不大，那么就小一些，达到节省内存的效果。如果你真的是插入/删除得频繁，那就可以考虑下下面的<strong>链式表</strong>。</p><p>行，不过这名字也太难听了，这汉语拼音英语吗，受不了。</p><p>那就改名字。</p><p>我们是使用数组实现的顺序表，数组就是 Array，表就是 List，那就取爹的姓妈的名，就叫 <strong>ArrayList</strong> 吧。这正是 Java 中的顺序表的名字。</p><p>好，名字也改了，我们就来看看链式表吧。</p><h2 id="链表" tabindex="-1">链表 <a class="header-anchor" href="#链表" aria-label="Permalink to &quot;链表&quot;">​</a></h2><p>其实我们在<a href="https://juejin.cn/book/7196580339181944872/section/7196588835345465384" target="_blank" rel="noreferrer">第 5 章</a>末尾就自定义过一个链表，只不过有点糙，这里我们就加以完善下。</p><p>我们需要提供跟上述<code>ArrayList</code>一样的 API 来供程序员使用，公平起见，我们就起名为<code>LinkedList</code>。我们直接上代码：</p><div class="language-text vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>// 定义元素Node</span></span>
<span class="line"><span>class Node {</span></span>
<span class="line"><span>    // 存放数值 </span></span>
<span class="line"><span>    int value;</span></span>
<span class="line"><span>    // 存放下一个元素的值</span></span>
<span class="line"><span>    Node next;</span></span>
<span class="line"><span>    // 构造函数</span></span>
<span class="line"><span>    Node(int value, Node next) {</span></span>
<span class="line"><span>        this.value = value;</span></span>
<span class="line"><span>        this.next = next;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    Node(int value) {</span></span>
<span class="line"><span>        this.value = value;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br></div></div><div class="language-text vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>class LinkedList {</span></span>
<span class="line"><span>    // 第一个元素</span></span>
<span class="line"><span>    private Node first;</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    // 添加元素</span></span>
<span class="line"><span>    public void put(int num) {</span></span>
<span class="line"><span>        // 创建新节点，新节点是在后面的，所以next就是null</span></span>
<span class="line"><span>        Node node = new Node(num, null);</span></span>
<span class="line"><span>        </span></span>
<span class="line"><span>        // 如果链表为空，这就是第一个节点，否则就加到链表后边</span></span>
<span class="line"><span>        if(first == null) {</span></span>
<span class="line"><span>            first = node;</span></span>
<span class="line"><span>        } else {</span></span>
<span class="line"><span>            first.next = node;</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    // 访问第index个元素，效率好低啊</span></span>
<span class="line"><span>    public int get(int index) {</span></span>
<span class="line"><span>        // 只能硬着头皮从前往后数index个元素</span></span>
<span class="line"><span>        int i = index;</span></span>
<span class="line"><span>        Node curNode = first;</span></span>
<span class="line"><span>        while(i &gt; 0) {</span></span>
<span class="line"><span>            // 这里可能有空指针，我们暂不考虑</span></span>
<span class="line"><span>            curNode = curNode.next;</span></span>
<span class="line"><span>            i--;</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>        return curNode.value;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    // 插入元素，效率好高啊</span></span>
<span class="line"><span>    public void add(int num, int index) {</span></span>
<span class="line"><span>        // 第一步，找到要插入的节点位置</span></span>
<span class="line"><span>        Node node = first;</span></span>
<span class="line"><span>        // 这里要先做减法，比如要插在3号位，就要找到2号位置即可。</span></span>
<span class="line"><span>        while(--index &gt; 0) node = node.next; </span></span>
<span class="line"><span>        </span></span>
<span class="line"><span>        // 第二步，插入元素，现在假设我们找到了2号位置</span></span>
<span class="line"><span>        Node newNode = new Node(num);</span></span>
<span class="line"><span>        newNode.next = node.next;</span></span>
<span class="line"><span>        node.next = newNode;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    // 删除元素，效率好高啊</span></span>
<span class="line"><span>    public void remove(int num, int index) {</span></span>
<span class="line"><span>        // 第一步，找到要删除的点</span></span>
<span class="line"><span>        Node node = first;</span></span>
<span class="line"><span>        // 这里要先做减法，比如要插在3号位，就要找到2号位置即可。</span></span>
<span class="line"><span>        while(--index &gt; 0) node = node.next;</span></span>
<span class="line"><span>        </span></span>
<span class="line"><span>        // 第二步，删除元素，直接让前面的next指向要删除的next就行</span></span>
<span class="line"><span>        node.next = node.next.next;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br><span class="line-number">21</span><br><span class="line-number">22</span><br><span class="line-number">23</span><br><span class="line-number">24</span><br><span class="line-number">25</span><br><span class="line-number">26</span><br><span class="line-number">27</span><br><span class="line-number">28</span><br><span class="line-number">29</span><br><span class="line-number">30</span><br><span class="line-number">31</span><br><span class="line-number">32</span><br><span class="line-number">33</span><br><span class="line-number">34</span><br><span class="line-number">35</span><br><span class="line-number">36</span><br><span class="line-number">37</span><br><span class="line-number">38</span><br><span class="line-number">39</span><br><span class="line-number">40</span><br><span class="line-number">41</span><br><span class="line-number">42</span><br><span class="line-number">43</span><br><span class="line-number">44</span><br><span class="line-number">45</span><br><span class="line-number">46</span><br><span class="line-number">47</span><br><span class="line-number">48</span><br><span class="line-number">49</span><br><span class="line-number">50</span><br><span class="line-number">51</span><br><span class="line-number">52</span><br><span class="line-number">53</span><br><span class="line-number">54</span><br></div></div><p>猛一看可能有点懵，我们来具体分析，假如链表如下（不懵的可以跳过哈）：</p><p><strong>A -&gt; B -&gt; D -&gt; E</strong></p><p>我们要在 D 位置插入 C，也就是要变成：<strong>A -&gt; B -&gt; C -&gt; D -&gt; E</strong>。</p><p>那我们首先就找到 B，然后创建出 C 节点。然后就让： <code>C.next = D</code>；但是我们没法直接拿到 D，我们就通过 B 来拿到 D，也就是：<code>C.next = B.next</code>，此时，C 的 next 就是 D 了。这一步之后，我们的链表就变成了：</p><p align="center"><img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6b4aca7afde6498ebe918ae5ba981e59~tplv-k3u1fbpfcp-watermark.image?" alt="image.png"></p><p>没错，那接下来，就需要让 B 指向 C 就行了，也就是： <code>B.next = C</code>。修改过后，我们的链表就变成了：</p><p align="center"><img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/02c000c1be674af3b7344f952e452b42~tplv-k3u1fbpfcp-watermark.image?" alt="image.png"></p><p>可以看到，C 已经正确地插入了链表中。</p><p>我们的执行步骤是：</p><div class="language-ini vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">ini</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">C.next</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> = B.next</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">B.next</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> = C</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">;</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br></div></div><p>其中，B 就是<code>add()</code>方法中的 node，C 就是<code>add()</code>方法中的 newNode。</p><p>有人说，我先让 B 指向 C，再让 C 指向 D 不行吗，也就是：</p><div class="language-ini vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">ini</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">B.next</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> = C</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">C.next</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> = B.next</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">;</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br></div></div><p>不行，因为你一旦执行<code>B.next = C</code>；那么<code>B.next</code>就变了，后面的<code>C.next = B.next</code>就等于<code>C.next = C</code>了，明显不对。</p><p>我们可以概括一点：<strong>你先把执行的步骤写下来，然后看有哪些是最后用到的，然后就将最后用到的放在后面即可</strong>。比如上面的<code>B.next</code>是最后用到的，就把用到它的语句放在最后。</p><p>至于链表的删除，就简单了，直接让 B 指向 C 即可，因为 B 指向 C 的操作隐含了断开 B 和 D 的连接。</p><p>有人说，你这效率高个毛啊，插入和删除还要遍历着找吗？这也好意思说效率高？</p><p>大哥喝冰阔罗消消火，你看我们的效率是相对而言的不是。你看隔壁<code>ArrayList</code>，它是没遍历，但是它要让后面所有人都挪挪位置，你说是报个数快呢，还是挨个挪一步快呢？</p><h2 id="栈和队列" tabindex="-1">栈和队列 <a class="header-anchor" href="#栈和队列" aria-label="Permalink to &quot;栈和队列&quot;">​</a></h2><p>其实栈和队列的设计很相似，如果出入都是同一头，那么就是栈，比如吃了 yue 出来；如果是一头入一头出，那就是队列，比如吃了拉出来。</p><p>那这个实现起来就丰富了，我们可以用一个数组，每次添加元素都放在后面，每次删除元素也删除后面，这样就是<strong>栈</strong>。</p><p align="center"><img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e41bb925222a476bbbeee1cde25f90bd~tplv-k3u1fbpfcp-watermark.image?" alt="image.png"></p><p>我们每次<code>push()</code>（存放元素）的时候，就让<code>curIndex+1</code>，也就是往右移，每次<code>pop()</code>（删除元素）的时候，就让<code>curIndex-1</code>，也就是往左移，这样就等于封死了左边的口，也就达到了<code>先入后出</code>的效果。</p><div class="language-text vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>int[] arr = new int[10]();</span></span>
<span class="line"><span>int curIndex = -1;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>// 入栈，加在后面</span></span>
<span class="line"><span>fun push(int num) {</span></span>
<span class="line"><span>    arr[++curIndex] = num;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>// 出栈，返回后面元素</span></span>
<span class="line"><span>fun pop() {</span></span>
<span class="line"><span>    return arr[curIndex--];</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br></div></div><p>猛一看，没问题，仔细一看，有很多问题。比如：栈空了怎么办？栈满了怎么办？</p><p>这个其实很简单，我们使用下标即可判断，如果<code>curIndex == arr.length</code>，那么就表示栈满了；如果<code>curIndex &lt; 0</code>，那就表示栈空了。如果栈满了，我们就需要扩容，扩容的方式跟<code>ArrayList</code>中的方式一模一样；如果栈空了，我们就要抛出异常或者返回空，以此来告诉调用者。</p><p>如果我们每次添加元素都放在后面，每次删除元素都删除前面，那么就是<strong>队列</strong>。</p><p align="center"><img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b511d39230c84b72b4f763102877e1a4~tplv-k3u1fbpfcp-watermark.image?" alt="image.png"></p><p>如果，我们每次让元素入队之后，都让<code>pushIndex+1</code>，也就是右移，这样就指向下一个要入队的位置；每次让元素出队之后，都让<code>popIndex+1</code>，这样就指向下一个要出队的元素。</p><div class="language-text vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>int[] arr;</span></span>
<span class="line"><span>// 记录入队伍位置</span></span>
<span class="line"><span>int pushIndex;</span></span>
<span class="line"><span>// 记录出队位置</span></span>
<span class="line"><span>int popIndex;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>// 入队</span></span>
<span class="line"><span>fun inQueue(int num) {</span></span>
<span class="line"><span>    arr[pushIndex++] = num;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>// 出队</span></span>
<span class="line"><span>fun outQueue(int num) {</span></span>
<span class="line"><span>    return arr[popIndex++];</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br></div></div><p>这个代码也有问题：这样出出入入来几次，马上就到头了，这样数组前面的元素空间不就浪费了吗？</p><p>这可咋整，我们可以这样？每次操作之后，就将所有元素都挪到左边，这样就可以让右边空出来了。</p><p>这也太费劲了，劳资不干！而且这种基操大大降低我代码的段位。有没有什么高级点的方法呢？</p><p>有！<strong>环形数组！</strong></p><p>假如，我是说假如，我们把数组头尾相连，也就是 0 和 10 连起来，这样形成一个环，是不是永远都不会到头啊。这样就爽多了。</p><p>但是这是不可能的啊，内存条，内存条，都说是条了，怎么会有环呢？嗯，我们物理上实现不了，我们就在逻辑上实现，我们怎么做呢？</p><p>我们每次计算的时候，不用<code>pushIndex</code>和<code>popIndex</code>了，我们用它们的模，也就是使用<code>pushIndex % arrayLength</code>和<code>popIndex % arrayLength</code>，其中<code>arrayLength</code>是数组的长度。那就变成了：</p><div class="language-text vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>// 假设数组长度是10</span></span>
<span class="line"><span>int length = 10;</span></span>
<span class="line"><span>int[] arr = new int[length]();</span></span>
<span class="line"><span>// 记录入队伍位置</span></span>
<span class="line"><span>int pushIndex;</span></span>
<span class="line"><span>// 记录出队位置</span></span>
<span class="line"><span>int popIndex;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>// 入队</span></span>
<span class="line"><span>fun inQueue(int num) {</span></span>
<span class="line"><span>    arr[pushIndex%length] = num;</span></span>
<span class="line"><span>    pushIndex++;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>// 出队</span></span>
<span class="line"><span>fun outQueue(int num) {</span></span>
<span class="line"><span>    return arr[popIndex%length];</span></span>
<span class="line"><span>    popIndex++;</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br></div></div><p>我们假设数组长度为 10，来验证下。如上图，我们存放到下标 9 的时候，<code>pushIndex++</code>就变成了 10，对 10 求余就变成了 0，也就是回到了下标为 0 的地方开始存放数据，这是对的。同样，<code>popIndex</code>也是对的。</p><p>那么又有问题了，这样怎么判断队列已满，又怎么判断队列为空呢？</p><p>很简单，我们看图，当<code>pushIndex</code>不断地存放数据，直到下标 1，也就是<code>popIndex</code>的前面，那么队列就放满了，此时： <strong>pushIndex+1==popIndex</strong>。</p><p>同理，如果<code>popIndex</code>不断取数据，直到下标为 6，也就是指向<code>pushIndex</code>，那么此时队列就空了，此时：<strong>pushIndex==popIndex</strong>。</p><p>由于我们的数组是环形的，我们的数字需要对长度求余，也就是：</p><ul><li>队列满：(pushIndex+1)%length == popIndex%10。</li><li>队列空：pushIndex%length == popIndex%10。</li></ul><p>当然，你也可以定义一个 count 值，来记录元素的个数，每次入队就加 1，每次出队就减 1，当<code>count==length</code>就是满了，当<code>count==0</code>就是空了。</p><p>我们也可以使用链表来实现栈和队列，这里就不再废话，原理其实就是一个：<strong>栈就是对一端进行左右挪移，存放就往外挪，删除就往内挪；队列就是对两头进行挪移，出入都往存放那一头挪</strong>。</p><p>大家可以对照示例图仔细体会下这句话。</p><h2 id="总结" tabindex="-1">总结 <a class="header-anchor" href="#总结" aria-label="Permalink to &quot;总结&quot;">​</a></h2><p>本章我们讲了常见数据结构的实现原理，我们没有讲任何 API，就单纯从它们的特点来设计这些数据结构，我们不必拘泥于它们的源码是怎么写的，只要明白其中的道理，写出工程性源码不过是时间问题。我们再来回顾下。</p><ul><li>对于<code>顺序表</code>，因为是顺序的，我们就可以用数组来模拟实现，这样就可以通过下标快速定位元素。</li><li>对于<code>链表</code>，因为是分散的，我们就可以用一个一个的节点来实现，然后通过持有下一个节点的引用把它串联起来。</li><li>对于<code>栈</code>和<code>队列</code>，实现方案有多种，我们只要理解挪移的方向即可。<strong>单端存外删内，双端都向存</strong>。</li></ul><p>那么下一章，我们就来了解下在开发中如何选择合适的数据结构，以及怎么由一级数据结构构造二级数据结构。</p>`,84)])])}const m=s(l,[["render",i]]);export{o as __pageData,m as default};
