---
title: SOA技术框架发展
date: 2018-06-25 13:56:04
toc: true
tags:
    - 技术
    - 论文
    - 架构
    - SOA
---

![SOA体系架构一览.png-106.7kB][7]

## 壹、引言 ##

> &emsp;&emsp;随着应用从集中式向分布式的迅速发展，为了解决现实Web应用中的“应用到应用”和“点对点”的核心问题，使当前Web应用适应全球化和复杂商务处理的需求，进行Web上已有的网络计算组件的集成，基于现有协议提高Web应用的互操作能力及服务质量，研究Web服务核心支撑技术有重要意义。**（4）**
&emsp;&emsp;从上世纪60年代应用于主机的大型主机系统，到80年代应用于PC的CS架构，一直到90年代互联网的出现，系统越来越朝小型化和分布式发展。2000年Web Service出现后，SOA（Service Oriented Architecture）被誉为下一代Web服务的基础框架，目前已经成为计算机信息领域的一个新的发展方向。**（1）** 
&emsp;&emsp;需要注意的是，SOA本身并不是新鲜的事物，但它却是更加传统的面向对象模型的替代模型。虽然SOA的系统并不排除使用面向对象的设计来构建单个服务，但整体上的设计确实是面向服务的。随着网络技术的发展，今天的SOA是基于已经广泛接受的Web服务标准，从而提供了跨越每个不同厂商相互性的解决方案。**（5）**

<!-- more -->

## 贰、WebService中的关键技术和框架 ##
&emsp;&emsp;网站的技术框架变迁也是随着需求不断变化而改变的，从结构单一、内容简单、表现形式死板的小型网站，到结构多样、内容丰富、动态化外观的大型网站，随着高并发、大流量、高可用和大数据等的涌入，大型网站架构进行了翻天覆地的变化。**（3）**并且，WebService的关键技术也在不断突破、完善和发展，下面先介绍Web Service中的支撑技术。

*Web Service中的关键技术：*
1. **XML技术**
XML是W3C组织于1998年2月发布的标准，W3C组织制定XML标准的初衷是：定义一种互联网上交换数据的标准。XML有三个关键要素：Schema（模式），XSL（eXtensible Stylesheet Lauguage 可扩展式样语言）和XLL（eXtensible Link Language 可扩展连接语言），Schema规定了XML文件的逻辑结构，XSL负责将XML数据翻译成HTML风格或其他风格。XLL是XML的连接语言，它与HTML连接相似，支持可扩展的连接和多方向连接。
2. **SOAP技术**
SOAP（Simple Object Access Protocol 简单对象访问协议）是一个基于HTTP和XML的请求/响应RPC协议，把XML的使用代码化为请求和响应参数码模型，并用HTTP作传输。SOAP信息都有一个根元素Envelope（信封），它包含header和body两部分，Header包含了上下文数据，可以不存在。body包含了具体的消息，必须存在。
3. **WSDL描述语言**
WSDL（Web Service Description Language, web服务描述语言）是为分布式系统提供自动执行应用程序通信中所设计细节的一种描述性文档。调用者可以通过服务在文档中所涉及的细节，了解通信所需的数据类型、消息结构和传输协议等信息，从而调用相关服务。
4. **UDDI技术**
UDDI（Universal Description, Discovery and Integration,统一描述、发现和集成）是一套面向Web服务的信息注册中心的实现标准和规范，创建UDDI注册中心的目的是实现Web服务的发布和实现。UDDI规范文本定义了UDDI操作的入口站点（UDDI Operator Site）能够支持的API接口和API中用XML描述的数据结构的具体规定。**（5）**

## 叁、SOA框架特色 ##
![SOA.JPG-19kB][1]
&emsp;&emsp;*图 1 Web Service体系架构模型*
> &emsp;&emsp;SOA是一种基于服务组件的开放软件平台，是面向服务的Internet应用，通过对SOA的构建，人们期望得到一个可编程的Internet。SOA将软件模块堪称一种Internet/Intranet上的简单服务单元，借助XML和广泛的Web协议，实现分布式的计算和异构平台的信息集成。SOA框架简图如图1所示。传统的SOA体系结构简单，分为服务请求者、服务提供者和服务代理3个角色。**（2）** 扩展后的SOA如下：

> 1. 服务提供者(Service Provider)：将商务过程子功能或消息封装成服务，发布服务并对自己服务的请求进行响应；
2. 服务代理(Register)：注册已经发布的服务，并对已经发布的服务进行分类，提供搜索服务；
3. 服务请求者(Service Requester or Service Consumer)：利用服务代理查找服务、使用服务；
4. 服务契约(Contract)：服务请求者（消费者）与服务提供者交互方式的规范，指明了服务请求和响应的格式。**（1）**

*SOA中的体系结构风格和关键技术：*
一、 **REST和系统的系统**
REST（Representational State Transfer, 表述性状态转移）是应用于分布式系统的软件体系结构风格，尤其是像万维网这样的分布式超媒体系统。REST最早是被Roy Thomas Fielding在2000年他的一篇博士论文中提出和解释的，并随着HTTP/1.1协议一起得到了发展。REST体系结构风格基于以下四项原则：

- **通过URL对资源进行标识**：URL（Uniform Resource Identifier, 统一资源定位符）为在组件的交互过程中用到的资源提供全球性寻址空间，也可以方便服务发现。

- **统一受限接口**：通过客户端/服务端可缓存的协议HTTP标准来完成与REST风格的Web服务进行交互。资源在使用的时候用到四个固定的动词CRUD（Create,Read,Update,Delete）或更为大家熟悉的PUT、GET、POST、DELETE操作。

- **自我描述消息**：REST消息包含足够多的信息来描述如何处理信息。这使得中介机构不需要解析消息内容就可以对消息进行更多的操作。在REST中，资源与它们的表示是分离的。

- **无状态的交互**：无状态的通信提高了可见性，因为监控系统为了确定请求可靠性的全部本质并不需要知道独立的请求数据字段外的内容，这样有利于从部分的失败中恢复未成功的任务，并丢弃请求之间的状态使得服务器组件更加快速地释放资源，这种方式显著增加了可扩展性。

二、**企业多层次体系架构**
企业应用通常使用多层体系结构来封装和集成各种功能。多层体系结构是一种客户端/服务器体系结构，其中表述、应用处理和数据管理是逻辑分离的过程。传统的两层客户端/服务器模型需要集群化和灾难恢复来保证可靠性。虽然在企业中使用较少的节点会简化可管理性，但是改变管理仍然很困难，因为在修理、升级和部署新应用时，都需要服务器下线。
一个三层的信息系统从两层信息系统分离扩展而来，包含以下层次：
1. **表述层**：向外部实体描述信息，并且允许他们通过提交操作和获得响应来与系统进行交互。
2. **商业/应用逻辑层或中间件**：通过表述层完成客户端请求的实际操作的程序。中间层也可以控制用户的认证、访问资源，以及完成一些客户端查询处理，这样可以减少数据库服务器的一些负载。
3. **资源管理层**：也称为数据层，处理和实现信息系统的不同数据源。**（6）**
下面是意义三层信息系统的简单结构图：
![一个三层的系统体系结构.jpg-22.5kB][2]
&emsp;&emsp;*图 2 一个三层的系统体系结构*

三、**网格服务和OGSA**
OGSA（Open Grid Services Architecture, 开放网格服务体系架构）是全球网格论坛（最近重命名为开放网格论坛OGF-Open Grid Forum），在2006年6月与企业网格联盟EGA-Enterprise Grid Alliance的OGSA工作组一起拟草制定的，是一个开放的面向服务的体系结构。其意图在于：
1. 便于在分布式的异构环境上使用和管理资源。
2. 提供无缝的服务质量。
3. 为了提供不同资源之间的互操作性，定义开放的发布接口。
4. 采用工业标准的集成技术。
5. 开发实现互操作性的标准。
6. 在分布式的异构环境中集成、虚拟化和管理各种服务与资源。
7. 提供松耦合的可交互服务，并且满足工业可接受的Web服务标准。
*OGSA服务可以分为七个大类：*（按照网格场景中经常用到的性能定义）
1. 基础设施服务：公共基础功能。
2. 运行管理服务：与启动和管理任务相关的功能。
3. 数据管理服务：维护、查询、更新、移动数据的功能。
4. 资源管理服务：将其他资源视为网格组件管理的功能。
5. 安全服务：支持安全资源共享和认证等的功能。
6. 信息服务：提供关于网格及其构成资源的日志、错误报告、监控和相对静态数据信息的功能。
7. 自我管理服务：自动化配置、调度等功能。

*SOA的优点如下：*

- **编码灵活**
可基于模块化的低层服务、采用不同组合方式创建高层服务，从而实现重用，这些都体现了编码的灵活性。此外，由于服务使用者不直接访问服务提供者，这种服务实现方式本身也可以灵活使用。
- **明确开发人员角色**
例如，熟悉BES的开发人员可以集中精力在重用访问层，协调层开发人员则无须特别了解BES的实现，而将精力放在解决高价值的业务问题上。
- **支持多种客户类型**
借助精确定义的业务接口和对XML、Web服务标准的支持，可以支持多种客户类型，包括PDA、手机等新型访问渠道。
- **更易于维护**
服务提供者和服务使用者的松耦合关系以及对开放标准的采用确保了这个特性的实现。
- **更好的伸缩性**
依靠服务设计、开发和部署所采用的架构模型实现伸缩性。服务提供者可以彼此独立调整，以满足服务需求。
- **更高的可用性**
该特性在服务提供者和服务使用者的松散耦合关系上得以体现。使用者无须了解提供者的实现细节，这样服务提供者就可以在WebLogic集群环境中灵活部署，使用者可以被转接到可用的例程上。**（1）**

## 肆、SOA服务设计 ##
![SOA服务创建执行过程.JPG-19.6kB][3]
&emsp;&emsp;*图 3 SOA服务创建执行过程*

> SOA实现方法遵循“服务就是一切”的架构思想。架构师架构系统时，也需要从服务的角度出发，首先考虑服务需求然后进行系统服务的装配（注意：服务都是粗粒度的功能划分）。整个软件过程划分为服务的定义、描述、发布、发现、绑定、服务的编排（业务逻辑设计）和调用过程。软件的功能模块体现为服务组建、接口。软件的设计过程体现为如图2所示。**（2）** 

*SOA架构的核心手段：*
1. **性能**
浏览器端可以通过浏览器缓存、页面压缩传输、合理布局页面、减少Cookie传输等手段，甚至可以用CDN加速功能。应用服务器端可以使用服务器本地缓存和分布式缓存或多台应用服务器组成一个集群共同对外服务。数据库服务器端可以使用索引、缓存、SQL性能优化等手段，也可使用NoSQL数据库存储等。
2. **可用性**
网站高可用的主要手段就是冗余，应用部署在多台服务器上同时提供服务，数据存储在多台服务器上相互备份，任何一台服务器出故障都不会影响整体的可用性，即多台服务器负载均衡设备组成集群。
3. **伸缩性**
所谓伸缩性是指不断向集群中加入硬件设备如服务器等的手段来缓解整体并发访问的压力和不断增长的数据存储的需求的能力。衡量标准当然是向集群中添加新的服务器设备提供的无差别服务的难易程度，以及集群中可容纳的总服务器数目是否有所限制。
4. **扩展性**
扩展的主要手段是事件驱动架构和分布式五福服务。事件驱动主要手段是消息队列的实现，将消息生产和处理逻辑分隔开。
5. **安全性**
是否有针对现存和潜在的各种攻击和窃密的手段，是否有可靠的应对策略。**（3）**

## 伍、轻量级Web框架Spring##
一、**Spring框架的发展历史**
&emsp;&emsp;J2EE平台规范是SUN公司制定的，基于Java技术的分布式构件运行平台规范，在此平台上可以方便、快速地建立融合Internet技术的多层结构分布式企业应用。
&emsp;&emsp;传统的J2EE架构方案采用带远程接口的Session Bean实现业务层构建，用Entity Bean实现数据访问层构建。该架构方案大量采用EJB构建，能够充分利用EJB容器（例如：We-blogic）提供的分布式处理、构件定位、统一的事务和安全服务等。然而，EJB构建却存在着极高的复杂度，开发效率低下，难以进行单元测试和数据库访问效率低下等严重问题。
&emsp;&emsp;普通轻量级J2EE架构方案用JavaBean构件代替了传统的重量级EJB构建，很大程度上提高了构建开发和构件的数据库访问效率。但架构过于简单，缺乏支持JavaBean构件运行的容器，构建需要解决组装、事务、日志和安全管理等问题。
&emsp;&emsp;Spring框架是Rod Johnson、Juergen Hoeller等开发的，用于支持JavaBean构件运行的容器。该框架提供了以来注入方式的构件组装机制和基于AOP技术的事物和日志管理等功能。基于Spring框架的轻量级J2EE架构能够发挥上述两种架构方案的优势，避免它们的缺陷，是一种成熟的J2EE应用开发方案。 **（7）**

二、**Spring框架体系架构**
*依赖注入技术的构件组装*
&emsp;&emsp;基于依赖注入技术的构件组装是Spring框架的技术核心和独特之处，它是指构件之间的依赖关系（即构件间的调用关系）用XML配置文件描述；在系统运行时，构件容器根据XML文件的描述完成构件组装。下面根据具体代码进行讲解：
&emsp;&emsp;首先编码两个简单的JavaBean，一个是Person一个是Book，代码如下所示：
```java
public class Person {
    private String name;
    private int age;
    private Book book;
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }
}
public class Book {
    private String name;
    private int price;
    private String place;
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getPrice() { return price; }
    public void setPrice(int price) { this.price = price; }
    public String getPlace() { return place; }
    public void setPlace(String place) { this.place = place; }
}
```
&emsp;&emsp;然后写一个XML用于描述Person与Book类之间的关系以及其他信息，代码如下：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
<!-- bean的配置文件 -->
<bean id="person" class="org.jingdong.bean.life.Person">
<property name="name" value="grl"></property>
<property name="age" value="11"></property>
<property name="book" ref="book"></property>
</bean>
<bean id="book" class="org.jingdong.bean.life.Book">
<property name="name" value="think in java"></property>
<property name="place" value="USA"></property>
<property name="price" value="79"></property>
</beans>
```
最后，通过XML解析器解析XML的内容并通过名称将Person类反射成一个Person实例。Java反射原理在本章中不做过多讨论，只需要知道可以通过包的全称和类名就可以将Java类构造出一个实例的方法。
```java
public class Main {
    public static void main(String[] args) {
        // 创建IOC容器
        ApplicationContext ac = new ClassPathXmlApplicationContext("applicationContext.xml");
        //从容器中获取bean实例
        Person person = (Person) ac.getBean("person");
        //使用bean
        System.out.println(person.getName());
    }
}
```

*Spring框架对数据访问层构架的支持*
&emsp;&emsp;数据访问层构件完成整个应用系统数据的持久化存储，需要具备较高的处理性能和安全保障机制。采用实体EJB实现该层构件难以满足处理性能的要求，在JavaBean中使用JDBC访问数据库需要进行繁琐的异常处理编码工作。而Spring提供了通用的数据库访问异常体系，用统一的模板机制解决了开闭连接，处理异常等问题。

*Aspect和统一的事务、日志管理*
Aspect是指软件系统中一些贯穿全局（cross-cutting）的特性，例如事务、日志等。面向Aspect的软件开发试图将这种特性的实现模块化，并与其他功能性的实现体分离开来，使用声明的方式将这些特性插入到系统视线中来。Aspect通常以类似于普通构件的方式在XML文件（或者在特殊的*.properties）中配置。**（8）**

三、**最新的Spring框架系列产品**

- Spring Boot（Build Anything）：Spring Boot 是为了用来快速搭建和运行开发平台的轻量级框架。它包含最少的前置Spring配置并且在构建就绪应用产品时，有丰富的可选视图。
- Spring Cloud（COORDINATE ANYTHING）：直接通过Spring Boot的开创性方式接入企业级Java，Spring Cloud 简化了分布式、微服务风格的架构，通过实现了更加有弹性、可靠和易于与你的微服务连接的方式。
- Spring Cloud Data Flow（CONNECT ANYTHING）：连接企业和网络上的各种硬件资源，包括移动设备、传感器、手机、穿戴设备等等。Spring Cloud Data Flow提供了全面的服务，通过基于ETL的数据处理模式和地址流产生组合数据。

## 陆、Spring JavaBean生命周期原理 ##
*深入理解JavaBean的生命周期*
&emsp;&emsp; 如图4所示，首先需要一个Bean的工厂类实例并执行postProcessBeanFactory方法实例化BeanPostProcessor实现类和InstantiationAwareBeanPostProcessorAdapter实现类的实例，执行后者的实例化Bean方法，执行Bean本身的构造器。这个时候，一个空的JavaBean对象已经被创建出来了。然后，需要给Bean注入属性，也就是里面的参数，实例化Student类就会注入学生姓名、学号等等内容。调用BeanNameAware方法，通知注册已经构造出来了一个实例，最后调用setBeanFactory方法获得通知。**（9）**

![JavaBean生命周期.png-24kB][4]
&emsp;&emsp; 图4 JavaBean生命周期

&emsp;&emsp;下面来具体阐述一下IOC容器初始化的过程，包括BeanDefinition的Resource定位、载入和注册三个基本过程。

㈠设置资源加载器和资源定位
```java
public FileSystemXmlApplicationContext(String[] configLocations, boolean refresh, ApplicationContext parent) throws BeansException {    
        super(parent);  
        setConfigLocations(configLocations);  
        if (refresh) {  
            refresh();  
        }  
    }
```
&emsp;&emsp;通过分析FileSystemXmlApplicationContext的源代码可以知道，在创建FileSystemXmlApplicationContext容器时，构造方法做以下两项重要工作。首先，调用父类容器的构造方法(super(parent)方法)为容器设置好Bean资源加载器。然后，再调用父类AbstractRefreshableConfigApplicationContext的setConfigLocations(configLocations)方法设置Bean定义资源文件的定位路径。
下面直接追踪FileSystemXmlApplicationContext的继承体系，发现其父类的父类AbstractApplicationContext中初始化IoC容器所做的主要源码如下：
```java
public abstract class AbstractApplicationContext extends DefaultResourceLoader  
        implements ConfigurableApplicationContext, DisposableBean { 
    static {
        ContextClosedEvent.class.getName();  
    }
    public AbstractApplicationContext(ApplicationContext parent) {  
        this.parent = parent;  
        this.resourcePatternResolver = getResourcePatternResolver();  
    }  
    protected ResourcePatternResolver getResourcePatternResolver() {
        return new PathMatchingResourcePatternResolver(this);  
    }   
……  
}
```
&emsp;&emsp;先看在static块（静态初始化块，在整个容器创建过程中只执行一次）中的部分，这是为了避免应用程序在Weblogic8.1关闭时出现类加载异常加载问题，加载IoC容器关闭事件(ContextClosedEvent)类。然后看到在之前的FileSystemXmlApplicationContext类构造函数中调用的父类构造方法，首先是保存传递过来的ApplicationContext然后执行getResourcePatternResolver方法获取一个Spring Source的加载器用于读入Spring Bean定义资源文件。然后，继续追溯PathMatchingResourcePatternResolver的构造方法是如何创建Spring资源加载器的。代码如下：
```java
public PathMatchingResourcePatternResolver(ResourceLoader resourceLoader) {  
        Assert.notNull(resourceLoader, "ResourceLoader must not be null");  
        this.resourceLoader = resourceLoader;  
} 
```
&emsp;&emsp;在设置容器的资源加载器之后，接下来FileSystemXmlApplicationContet执行setConfigLocations方法通过调用其父类AbstractRefreshableConfigApplicationContext的方法进行对Bean定义资源文件的定位，该方法的源码如下：
```java
    public void setConfigLocation(String location) {
        setConfigLocations(StringUtils.tokenizeToStringArray(location, CONFIG_LOCATION_DELIMITERS));  
    }  

     public void setConfigLocations(String[] locations) {  
        if (locations != null) {  
            Assert.noNullElements(locations, "Config locations must not be null");  
            this.configLocations = new String[locations.length];  
            for (int i = 0; i < locations.length; i++) {
                this.configLocations[i] = resolvePath(locations[i]).trim();  
            }  
        }  
        else {  
            this.configLocations = null;  
        }  
    }
```
&emsp;&emsp;有两种形式解析资源文件路径。一个是通过setConfigLocation方法处理单个资源文件路径，字符串常量CONFIG _LOCATION_DELIMITERS=",; /t/n"，即多个资源文件路径之间用” ,; /t/n”分隔，解析成数组形式。第二种是通过解析Bean定义资源文件的路径，处理多个资源文件字符串数组，resolvePath为同一个类中将字符串解析为路径的方法。通过这两个方法的源码我们可以看出，我们既可以使用一个字符串来配置多个Spring Bean定义资源文件，也可以使用字符串数组，即下面两种方式都是可以的：

- ClasspathResource res = new ClasspathResource(“a.xml,b.xml,……”);
多个资源文件路径之间可以是用” ,; /t/n”等分隔。
- ClasspathResource res = new ClasspathResource(newString[]{“a.xml”,”b.xml”,……});
至此，Spring IoC容器在初始化时将配置的Bean定义资源文件定位为Spring封装的Resource。

㈡AbstractApplicationContext的refresh函数载入Bean定义过程
&emsp;&emsp;Spring IoC容器对Bean定义资源的载入是从refresh()函数开始的，refresh()是一个模板方法，refresh()方法的作用是：在创建IoC容器前，如果已经有容器存在，则需要把已有的容器销毁和关闭，以保证在refresh之后使用的是新建立起来的IoC容器。refresh的作用类似于对IoC容器的重启，在新建立好的容器中对容器进行初始化，对Bean定义资源进行载入。FileSystemXmlApplicationContext通过调用其父类AbstractApplicationContext的refresh()函数启动整个IoC容器对Bean定义的载入过程：
```java
public void refresh() throws BeansException, IllegalStateException {  
       synchronized (this.startupShutdownMonitor) {  
           //调用容器准备刷新的方法，获取容器的当时时间，同时给容器设置同步标识  
           prepareRefresh();  
           //告诉子类启动refreshBeanFactory()方法，Bean定义资源文件的载入从  
          //子类的refreshBeanFactory()方法启动  
           ConfigurableListableBeanFactory beanFactory = obtainFreshBeanFactory();  
           //为BeanFactory配置容器特性，例如类加载器、事件处理器等  
           prepareBeanFactory(beanFactory);  
           try {  
               //为容器的某些子类指定特殊的BeanPost事件处理器  
               postProcessBeanFactory(beanFactory);  
               //调用所有注册的BeanFactoryPostProcessor的Bean  
               invokeBeanFactoryPostProcessors(beanFactory);  
               //为BeanFactory注册BeanPost事件处理器.  
               //BeanPostProcessor是Bean后置处理器，用于监听容器触发的事件  
               registerBeanPostProcessors(beanFactory);  
               //初始化信息源，和国际化相关.  
               initMessageSource();  
               //初始化容器事件传播器.  
               initApplicationEventMulticaster();  
               //调用子类的某些特殊Bean初始化方法  
               onRefresh();  
               //为事件传播器注册事件监听器.  
               registerListeners();  
               //初始化所有剩余的单态Bean.  
               finishBeanFactoryInitialization(beanFactory);  
               //初始化容器的生命周期事件处理器，并发布容器的生命周期事件  
               finishRefresh();  
           }  
           catch (BeansException ex) {  
               //销毁以创建的单态Bean  
               destroyBeans();  
               //取消refresh操作，重置容器的同步标识.  
               cancelRefresh(ex);  
               throw ex;  
           }  
       }  
   }
```
&emsp;&emsp;refresh()方法的作用是：在创建IoC容器前，如果已经有容器存在，则需要把已有的容器销毁和关闭，以保证在refresh之后使用的是新建立起来的IoC容器。refresh的作用类似于对IoC容器的重启，在新建立好的容器中对容器进行初始化，对Bean定义资源进行载入。主要为IoC容器Bean的生命周期管理提供条件，Spring IoC容器载入Bean定义资源文件从其子类容器的refreshBeanFactory()方法启动，所以整个refresh()中ConfigurableListableBeanFactory beanFactory=obtainFreshBeanFactory();这句以后代码的都是注册容器的信息源和生命周期事件，载入过程就是从这句代码启动。AbstractApplicationContext的obtainFreshBeanFactory()方法调用子类容器的refreshBeanFactory()方法，启动容器载入Bean定义资源文件的过程，代码如下：
```java
protected ConfigurableListableBeanFactory obtainFreshBeanFactory() {  
         refreshBeanFactory();  
        ConfigurableListableBeanFactory beanFactory = getBeanFactory();  
        if (logger.isDebugEnabled()) {  
            logger.debug("Bean factory for " + getDisplayName() + ": " + beanFactory);  
        }  
        return beanFactory;  
    }
```
这里使用了委派设计模式，父类定义了抽象的refreshBeanFactory()方法，具体实现调用子类容器的refreshBeanFactory()方法。AbstractApplicationContext子类的refreshBeanFactory()方法：
```java
protected final void refreshBeanFactory() throws BeansException {  
       if (hasBeanFactory()) {//如果已经有容器，销毁容器中的bean，关闭容器  
           destroyBeans();  
           closeBeanFactory();  
       }  
       try {  
            //创建IoC容器  
            DefaultListableBeanFactory beanFactory = createBeanFactory();  
            beanFactory.setSerializationId(getId());  
           //对IoC容器进行定制化，如设置启动参数，开启注解的自动装配等  
           customizeBeanFactory(beanFactory);  
           //调用载入Bean定义的方法，主要这里又使用了一个委派模式，在当前类中只定义了抽象的loadBeanDefinitions方法，具体的实现调用子类容器  
           loadBeanDefinitions(beanFactory);  
           synchronized (this.beanFactoryMonitor) {  
               this.beanFactory = beanFactory;  
           }  
       }  
       catch (IOException ex) {  
           throw new ApplicationContextException("I/O error parsing bean definition source for " + getDisplayName(), ex);  
       }  
   }
```
&emsp;&emsp;在这个方法中，先判断BeanFactory是否存在，如果存在则先销毁beans并关闭beanFactory，接着创建DefaultListableBeanFactory，并调用loadBeanDefinitions(beanFactory)装载bean定义。

㈢AbstractRefreshableApplicationContext子类的loadBeanDefinitions方法
```java
public abstract class AbstractXmlApplicationContext extends AbstractRefreshableConfigApplicationContext {  
    ……  
    //实现父类抽象的载入Bean定义方法  
    @Override  
    protected void loadBeanDefinitions(DefaultListableBeanFactory beanFactory) throws BeansException, IOException {  
        //创建XmlBeanDefinitionReader，即创建Bean读取器，并通过回调设置到容器中去，容  器使用该读取器读取Bean定义资源  
        XmlBeanDefinitionReader beanDefinitionReader = new XmlBeanDefinitionReader(beanFactory);  
        //为Bean读取器设置Spring资源加载器，AbstractXmlApplicationContext的  
        //祖先父类AbstractApplicationContext继承DefaultResourceLoader，因此，容器本身也是一个资源加载器  
       beanDefinitionReader.setResourceLoader(this);  
       //为Bean读取器设置SAX xml解析器  
       beanDefinitionReader.setEntityResolver(new ResourceEntityResolver(this));  
       //当Bean读取器读取Bean定义的Xml资源文件时，启用Xml的校验机制  
       initBeanDefinitionReader(beanDefinitionReader);  
       //Bean读取器真正实现加载的方法  
       loadBeanDefinitions(beanDefinitionReader);  
   }  
   //Xml Bean读取器加载Bean定义资源  
   protected void loadBeanDefinitions(XmlBeanDefinitionReader reader) throws BeansException, IOException {  
       //获取Bean定义资源的定位  
       Resource[] configResources = getConfigResources();  
       if (configResources != null) {  
           //Xml Bean读取器调用其父类AbstractBeanDefinitionReader读取定位  
           //的Bean定义资源  
           reader.loadBeanDefinitions(configResources);  
       }  
       //如果子类中获取的Bean定义资源定位为空，则获取FileSystemXmlApplicationContext构造方法中setConfigLocations方法设置的资源  
       String[] configLocations = getConfigLocations();  
       if (configLocations != null) {  
           //Xml Bean读取器调用其父类AbstractBeanDefinitionReader读取定位  
           //的Bean定义资源  
           reader.loadBeanDefinitions(configLocations);  
       }  
   }  
   //这里又使用了一个委托模式，调用子类的获取Bean定义资源定位的方法  
   //该方法在ClassPathXmlApplicationContext中进行实现，对于我们  
   //举例分析源码的FileSystemXmlApplicationContext没有使用该方法  
   protected Resource[] getConfigResources() {  
       return null;  
   }   ……  
}
```
&emsp;&emsp;Xml Bean读取器(XmlBeanDefinitionReader)调用其父类AbstractBeanDefinitionReader的 reader.loadBeanDefinitions方法读取Bean定义资源。由于我们使用FileSystemXmlApplicationContext作为例子分析，因此getConfigResources的返回值为null，因此程序执行reader.loadBeanDefinitions(configLocations)分支。

㈣AbstractBeanDefinitionReader读取Bean定义资源
AbstractBeanDefinitionReader的loadBeanDefinitions方法源码如下：
```java
//重载方法，调用下面的loadBeanDefinitions(String, Set<Resource>);方法  
   public int loadBeanDefinitions(String location) throws BeanDefinitionStoreException {  
       return loadBeanDefinitions(location, null);  
   }  
   public int loadBeanDefinitions(String location, Set<Resource> actualResources) throws BeanDefinitionStoreException {  
       //获取在IoC容器初始化过程中设置的资源加载器  
       ResourceLoader resourceLoader = getResourceLoader();  
       if (resourceLoader == null) {  
           throw new BeanDefinitionStoreException(  
                   "Cannot import bean definitions from location [" + location + "]: no ResourceLoader available");  
       }  
       if (resourceLoader instanceof ResourcePatternResolver) {  
           try {  
               //将指定位置的Bean定义资源文件解析为Spring IoC容器封装的资源  
               //加载多个指定位置的Bean定义资源文件  
               Resource[] resources = ((ResourcePatternResolver) resourceLoader).getResources(location);  
               //委派调用其子类XmlBeanDefinitionReader的方法，实现加载功能  
               int loadCount = loadBeanDefinitions(resources);  
               if (actualResources != null) {  
                   for (Resource resource : resources) {  
                       actualResources.add(resource);  
                   }  
               }  
               if (logger.isDebugEnabled()) {  
                   logger.debug("Loaded " + loadCount + " bean definitions from location pattern [" + location + "]");  
               }  
               return loadCount;  
           }  
           catch (IOException ex) {  
               throw new BeanDefinitionStoreException(  
                       "Could not resolve bean definition resource pattern [" + location + "]", ex);  
           }  
       }  
       else {  
           //将指定位置的Bean定义资源文件解析为Spring IoC容器封装的资源  
           //加载单个指定位置的Bean定义资源文件  
           Resource resource = resourceLoader.getResource(location);  
           //委派调用其子类XmlBeanDefinitionReader的方法，实现加载功能  
           int loadCount = loadBeanDefinitions(resource);  
           if (actualResources != null) {  
               actualResources.add(resource);  
           }  
           if (logger.isDebugEnabled()) {  
               logger.debug("Loaded " + loadCount + " bean definitions from location [" + location + "]");  
           }  
           return loadCount;  
       }  
   }  
   //重载方法，调用loadBeanDefinitions(String);  
   public int loadBeanDefinitions(String... locations) throws BeanDefinitionStoreException {  
       Assert.notNull(locations, "Location array must not be null");  
       int counter = 0;  
       for (String location : locations) {  
           counter += loadBeanDefinitions(location);  
       }  
       return counter;  
    }
```
&emsp;&emsp;loadBeanDefinitions(Resource...resources)方法和上面分析的3个方法类似，同样也是调用XmlBeanDefinitionReader的loadBeanDefinitions方法。从对AbstractBeanDefinitionReader的loadBeanDefinitions方法源码分析可以看出该方法做了以下两件事。首先，调用资源加载器的获取资源方法resourceLoader.getResource(location)，获取到要加载的资源。其次，真正执行加载功能是其子类XmlBeanDefinitionReader的loadBeanDefinitions方法。

㈤资源加载器获取要读入的资源
XmlBeanDefinitionReader通过调用其父类DefaultResourceLoader的getResource方法获取要加载的资源，其源码如下:
```java
//获取Resource的具体实现方法  
   public Resource getResource(String location) {  
       Assert.notNull(location, "Location must not be null");  
       //如果是类路径的方式，那需要使用ClassPathResource 来得到bean 文件的资源对象  
       if (location.startsWith(CLASSPATH_URL_PREFIX)) {  
           return new ClassPathResource(location.substring(CLASSPATH_URL_PREFIX.length()), getClassLoader());  
       }  
        try {  
             // 如果是URL 方式，使用UrlResource 作为bean 文件的资源对象  
            URL url = new URL(location);  
            return new UrlResource(url);  
           }  
           catch (MalformedURLException ex) { 
           } 
           //如果既不是classpath标识，又不是URL标识的Resource定位，则调用  
           //容器本身的getResourceByPath方法获取Resource  
           return getResourceByPath(location);  
           
   }
```
FileSystemXmlApplicationContext容器提供了getResourceByPath方法的实现，就是为了处理既不是classpath标识，又不是URL标识的Resource定位这种情况。
```java
protected Resource getResourceByPath(String path) {    
   if (path != null && path.startsWith("/")) {    
        path = path.substring(1);    
    }  
    //这里使用文件系统资源对象来定义bean 文件
    return new FileSystemResource(path);  
}
```
&emsp;&emsp;这样代码就回到了 FileSystemXmlApplicationContext 中来，他提供了FileSystemResource 来完成从文件系统得到配置文件的资源定义。这样，就可以从文件系统路径上对IOC 配置文件进行加载 - 当然我们可以按照这个逻辑从任何地方加载，在Spring 中我们看到它提供 的各种资源抽象，比如ClassPathResource, URLResource,FileSystemResource 等来供我们使用。上面我们看到的是定位Resource 的一个过程，而这只是加载过程的一部分。

㈥XmlBeanDefinitionReader加载Bean定义资源
继续回到XmlBeanDefinitionReader的loadBeanDefinitions(Resource …)方法看到代表bean文件的资源定义以后的载入过程。
```java
//XmlBeanDefinitionReader加载资源的入口方法  
   public int loadBeanDefinitions(Resource resource) throws BeanDefinitionStoreException {  
       //将读入的XML资源进行特殊编码处理  
       return loadBeanDefinitions(new EncodedResource(resource));  
   } 
     //这里是载入XML形式Bean定义资源文件方法
   public int loadBeanDefinitions(EncodedResource encodedResource) throws BeanDefinitionStoreException {    
   .......    
   try {    
        //将资源文件转为InputStream的IO流 
       InputStream inputStream = encodedResource.getResource().getInputStream();    
       try {    
          //从InputStream中得到XML的解析源    
           InputSource inputSource = new InputSource(inputStream);    
           if (encodedResource.getEncoding() != null) {    
               inputSource.setEncoding(encodedResource.getEncoding());    
           }    
           //这里是具体的读取过程    
           return doLoadBeanDefinitions(inputSource, encodedResource.getResource());    
       }    
       finally {    
           //关闭从Resource中得到的IO流    
           inputStream.close();    
       }    
   }    
      .........    
26}    
   //从特定XML文件中实际载入Bean定义资源的方法 
   protected int doLoadBeanDefinitions(InputSource inputSource, Resource resource)    
       throws BeanDefinitionStoreException {    
   try {    
       int validationMode = getValidationModeForResource(resource);    
       //将XML文件转换为DOM对象，解析过程由documentLoader实现    
       Document doc = this.documentLoader.loadDocument(    
               inputSource, this.entityResolver, this.errorHandler, validationMode, this.namespaceAware);    
       //这里是启动对Bean定义解析的详细过程，该解析过程会用到Spring的Bean配置规则
       return registerBeanDefinitions(doc, resource);    
     }    
     .......    
     }
```
通过源码分析，载入Bean定义资源文件的最后一步是将Bean定义资源转换为Document对象，该过程由documentLoader实现。DocumentLoader将Bean定义资源转换为Document对象：
```java
//使用标准的JAXP将载入的Bean定义资源转换成document对象  
   public Document loadDocument(InputSource inputSource, EntityResolver entityResolver,  
           ErrorHandler errorHandler, int validationMode, boolean namespaceAware) throws Exception {  
       //创建文件解析器工厂  
       DocumentBuilderFactory factory = createDocumentBuilderFactory(validationMode, namespaceAware);  
       if (logger.isDebugEnabled()) {  
           logger.debug("Using JAXP provider [" + factory.getClass().getName() + "]");  
       }  
       //创建文档解析器  
       DocumentBuilder builder = createDocumentBuilder(factory, entityResolver, errorHandler);  
       //解析Spring的Bean定义资源  
       return builder.parse(inputSource);  
   }  
   protected DocumentBuilderFactory createDocumentBuilderFactory(int validationMode, boolean namespaceAware)  
           throws ParserConfigurationException {  
       //创建文档解析工厂  
       DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();  
       factory.setNamespaceAware(namespaceAware);  
       //设置解析XML的校验  
       if (validationMode != XmlValidationModeDetector.VALIDATION_NONE) {  
           factory.setValidating(true);  
           if (validationMode == XmlValidationModeDetector.VALIDATION_XSD) {  
               factory.setNamespaceAware(true);  
               try {  
                   factory.setAttribute(SCHEMA_LANGUAGE_ATTRIBUTE, XSD_SCHEMA_LANGUAGE);  
               }  
               catch (IllegalArgumentException ex) {  
                   ParserConfigurationException pcex = new ParserConfigurationException(  
                           "Unable to validate using XSD: Your JAXP provider [" + factory +  
                           "] does not support XML Schema. Are you running on Java 1.4 with Apache Crimson? " +  
                           "Upgrade to Apache Xerces (or Java 1.5) for full XSD support.");  
                   pcex.initCause(ex);  
                   throw pcex;  
               }  
           }  
       }  
       return factory;  
   }
```
&emsp;&emsp;该解析过程调用JavaEE标准的JAXP标准进行处理。至此Spring IoC容器根据定位的Bean定义资源文件，将其加载读入并转换成为Document对象过程完成。接下来我们要继续分析Spring IoC容器将载入的Bean定义资源文件转换为Document对象之后，是如何将其解析为Spring IoC管理的Bean对象并将其注册到容器中的。

㈦XmlBeanDefinitionReader解析载入的Bean定义资源文件
```java
//按照Spring的Bean语义要求将Bean定义资源解析并转换为容器内部数据结构  
   public int registerBeanDefinitions(Document doc, Resource resource) throws BeanDefinitionStoreException {  
       //得到BeanDefinitionDocumentReader来对xml格式的BeanDefinition解析  
       BeanDefinitionDocumentReader documentReader = createBeanDefinitionDocumentReader();  
       //获得容器中注册的Bean数量  
       int countBefore = getRegistry().getBeanDefinitionCount();  
       //解析过程入口，这里使用了委派模式，BeanDefinitionDocumentReader只是个接口，//具体的解析实现过程有实现类DefaultBeanDefinitionDocumentReader完成  
       documentReader.registerBeanDefinitions(doc, createReaderContext(resource));  
       //统计解析的Bean数量  
       return getRegistry().getBeanDefinitionCount() - countBefore;  
   }  
   //创建BeanDefinitionDocumentReader对象，解析Document对象  
   protected BeanDefinitionDocumentReader createBeanDefinitionDocumentReader() {  
       return BeanDefinitionDocumentReader.class.cast(BeanUtils.instantiateClass(this.documentReaderClass));  
      }
```
&emsp;&emsp;Bean定义资源的载入解析分为以下两个过程。首先，通过调用XML解析器将Bean定义资源文件转换得到Document对象，但是这些Document对象并没有按照Spring的Bean规则进行解析，这一步是载入的过程。其次，在完成通用的XML解析之后，按照Spring的Bean规则对Document对象进行解析。按照Spring的Bean规则对Document对象解析的过程是在接口BeanDefinitionDocumentReader的实现类DefaultBeanDefinitionDocumentReader中实现的。

㈧DefaultBeanDefinitionDocumentReader对Bean定义的Document对象解析
以下为核心XML分析器的工作原理代码：
```java
//解析<Bean>元素中的<property>子元素  
   public void parsePropertyElements(Element beanEle, BeanDefinition bd) {  
       //获取<Bean>元素中所有的子元素  
       NodeList nl = beanEle.getChildNodes();  
       for (int i = 0; i < nl.getLength(); i++) {  
           Node node = nl.item(i);  
           //如果子元素是<property>子元素，则调用解析<property>子元素方法解析  
           if (isCandidateElement(node) && nodeNameEquals(node, PROPERTY_ELEMENT)) {  
               parsePropertyElement((Element) node, bd);  
           }  
       }  
   }  
   //解析<property>元素  
   public void parsePropertyElement(Element ele, BeanDefinition bd) {  
       //获取<property>元素的名字   
       String propertyName = ele.getAttribute(NAME_ATTRIBUTE);  
       if (!StringUtils.hasLength(propertyName)) {  
           error("Tag 'property' must have a 'name' attribute", ele);  
           return;  
       }  
       this.parseState.push(new PropertyEntry(propertyName));  
       try {  
           //如果一个Bean中已经有同名的property存在，则不进行解析，直接返回。  
           //即如果在同一个Bean中配置同名的property，则只有第一个起作用  
           if (bd.getPropertyValues().contains(propertyName)) {  
               error("Multiple 'property' definitions for property '" + propertyName + "'", ele);  
               return;  
           }  
           //解析获取property的值  
           Object val = parsePropertyValue(ele, bd, propertyName);  
           //根据property的名字和值创建property实例  
           PropertyValue pv = new PropertyValue(propertyName, val);  
           //解析<property>元素中的属性  
           parseMetaElements(ele, pv);  
           pv.setSource(extractSource(ele));  
           bd.getPropertyValues().addPropertyValue(pv);  
       }  
       finally {  
           this.parseState.pop();  
       }  
   }  
   //解析获取property值  
   public Object parsePropertyValue(Element ele, BeanDefinition bd, String propertyName) {  
       String elementName = (propertyName != null) ?  
                       "<property> element for property '" + propertyName + "'" :  
                       "<constructor-arg> element";  
       //获取<property>的所有子元素，只能是其中一种类型:ref,value,list等  
       NodeList nl = ele.getChildNodes();  
       Element subElement = null;  
       for (int i = 0; i < nl.getLength(); i++) {  
           Node node = nl.item(i);  
           //子元素不是description和meta属性  
           if (node instanceof Element && !nodeNameEquals(node, DESCRIPTION_ELEMENT) &&  
                   !nodeNameEquals(node, META_ELEMENT)) {  
               if (subElement != null) {  
                   error(elementName + " must not contain more than one sub-element", ele);  
               }  
               else {//当前<property>元素包含有子元素  
                   subElement = (Element) node;  
               }  
           }  
       }  
       //判断property的属性值是ref还是value，不允许既是ref又是value  
       boolean hasRefAttribute = ele.hasAttribute(REF_ATTRIBUTE);  
       boolean hasValueAttribute = ele.hasAttribute(VALUE_ATTRIBUTE);  
       if ((hasRefAttribute && hasValueAttribute) ||  
               ((hasRefAttribute || hasValueAttribute) && subElement != null)) {  
           error(elementName +  
                   " is only allowed to contain either 'ref' attribute OR 'value' attribute OR sub-element", ele);  
       }  
       //如果属性是ref，创建一个ref的数据对象RuntimeBeanReference，这个对象  
       //封装了ref信息  
       if (hasRefAttribute) {  
           String refName = ele.getAttribute(REF_ATTRIBUTE);  
           if (!StringUtils.hasText(refName)) {  
               error(elementName + " contains empty 'ref' attribute", ele);  
           }  
           //一个指向运行时所依赖对象的引用  
           RuntimeBeanReference ref = new RuntimeBeanReference(refName);  
           //设置这个ref的数据对象是被当前的property对象所引用  
           ref.setSource(extractSource(ele));  
           return ref;  
       }  
        //如果属性是value，创建一个value的数据对象TypedStringValue，这个对象  
       //封装了value信息  
       else if (hasValueAttribute) {  
           //一个持有String类型值的对象  
           TypedStringValue valueHolder = new TypedStringValue(ele.getAttribute(VALUE_ATTRIBUTE));  
           //设置这个value数据对象是被当前的property对象所引用  
           valueHolder.setSource(extractSource(ele));  
           return valueHolder;  
       }  
       //如果当前<property>元素还有子元素  
       else if (subElement != null) {  
           //解析<property>的子元素  
           return parsePropertySubElement(subElement, bd);  
       }  
       else {  
           //propery属性中既不是ref，也不是value属性，解析出错返回null        error(elementName + " must specify a ref or value", ele);  
           return null;  
       }  
    }
```
&emsp;&emsp;通过对上述源码的分析，我们可以了解在Spring配置文件中，<Bean>元素中<property>元素的相关配置是如何处理的：

- ref被封装为指向依赖对象一个引用。
- value配置都会封装成一个字符串类型的对象。
- ref和value都通过“解析的数据类型属性值.setSource(extractSource(ele));”方法将属性值/引用与所引用的属性关联起来。
&emsp;&emsp;在方法的最后对于<property>元素的子元素通过parsePropertySubElement 方法解析，我们继续分析该方法的源码，了解其解析过程。这里就不赘述了，可知道XML解析过程也是通过和词法分析类似的技术进行抽析的。

㈨总结IOC初始化的基本步骤
现在通过上面的代码，总结一下IOC容器初始化的基本步骤：
1. 初始化的入口在容器实现中的 refresh()调用来完成
2. 对 bean 定义载入 IOC 容器使用的方法是 loadBeanDefinition,其中的大致过程如下：通过 ResourceLoader 来完成资源文件位置的定位，DefaultResourceLoader 是默认的实现，同时上下文本身就给出了 ResourceLoader 的实现，可以从类路径，文件系统, URL 等方式来定为资源位置。如果是 XmlBeanFactory作为 IOC 容器，那么需要为它指定 bean 定义的资源，也就是说 bean 定义文件时通过抽象成 Resource 来被 IOC 容器处理的，容器通过 BeanDefinitionReader来完成定义信息的解析和 Bean信息的注册,往往使用的是XmlBeanDefinitionReader 来解析 bean 的 xml 定义文件 - 实际的处理过程是委托给 BeanDefinitionParserDelegate来完成的，从而得到 bean 的定义信息，这些信息在 Spring 中使用 BeanDefinition 对象来表示 - 这个名字可以让我们想到loadBeanDefinition,RegisterBeanDefinition  这些相关的方法 - 他们都是为处理 BeanDefinitin 服务的， 容器解析得到 BeanDefinitionIoC 以后，需要把它在 IOC 容器中注册，这由 IOC 实现 BeanDefinitionRegistry接口来实现。注册过程就是在 IOC容器内部维护的一个HashMap 来保存得到的 BeanDefinition 的过程。这个 HashMap 是 IoC 容器持有 bean 信息的场所，以后对 bean 的操作都是围绕这个HashMap 来实现的。
3. 然后我们就可以通过 BeanFactory 和 ApplicationContext 来享受到 Spring IOC 的服务了,在使用 IOC 容器的时候，我们注意到除了少量粘合代码，绝大多数以正确 IoC 风格编写的应用程序代码完全不用关心如何到达工厂，因为容器将把这些对象与容器管理的其他对象钩在一起。基本的策略是把工厂放到已知的地方，最好是放在对预期使用的上下文有意义的地方，以及代码将实际需要访问工厂的地方。 Spring 本身提供了对声明式载入 web 应用程序用法的应用程序上下文,并将其存储在ServletContext 中的框架实现。 

在使用 Spring IOC 容器的时候我们还需要区别两个概念:
> Beanfactory 和 Factory bean，其中 BeanFactory 指的是 IOC 容器的编程抽象，比如 ApplicationContext， XmlBeanFactory 等，这些都是 IOC 容器的具体表现，需要使用什么样的容器由客户决定,但 Spring 为我们提供了丰富的选择。 FactoryBean 只是一个可以在 IOC而容器中被管理的一个 bean,是对各种处理过程和资源使用的抽象,Factory bean 在需要时产生另一个对象，而不返回 FactoryBean本身,我们可以把它看成是一个抽象工厂，对它的调用返回的是工厂生产的产品。所有的 Factory bean 都实现特殊的org.springframework.beans.factory.FactoryBean 接口，当使用容器中 factory bean 的时候，该容器不会返回 factory bean 本身,而是返回其生成的对象。Spring 包括了大部分的通用资源和服务访问抽象的 Factory bean 的实现，其中包括:对 JNDI 查询的处理，对代理对象的处理，对事务性代理的处理，对 RMI 代理的处理等，这些我们都可以看成是具体的工厂,看成是SPRING 为我们建立好的工厂。也就是说 Spring 通过使用抽象工厂模式为我们准备了一系列工厂来生产一些特定的对象,免除我们手工重复的工作，我们要使用时只需要在 IOC 容器里配置好就能很方便的使用了。

㈩Spring Bean的工厂模式
&emsp;&emsp;其中BeanFactory作为最顶层的一个接口类，它定义了IOC容器的基本功能规范，BeanFactory有三个子类：ListableBeanFactory、HierarchicalBeanFactory和AutowireCapableBeanFactory。但是从上图中我们可以发现最终的默认实现类是DefaultListableBeanFactory，他实现了所有的接口。那为何要定义这么多层次的接口呢？查阅这些接口的源码和说明发现，每个接口都有他使用的场合，它主要是为了区分在 Spring 内部在操作过程中对象的传递和转化过程中，对对象的数据访问所做的限制。例如 ListableBeanFactory 接口表示这些 Bean 是可列表的，而 HierarchicalBeanFactory 表示的是这些 Bean是有继承关系的，也就是每个Bean 有可能有父 Bean。AutowireCapableBeanFactory 接口定义 Bean 的自动装配规则。这四个接口共同定义了 Bean 的集合、Bean 之间的关系、以及 Bean 行为。Class结构关系如图5所示。**（10）**
![Spring_Bean的工厂模式.png-106.7kB][5]
&emsp;&emsp; 图5 Spring Bean的工厂模式

## 柒、DUBBO框架##
一、 **简介**
> &emsp;&emsp;***a high-performance.java basesd,open source RPC framework.***
> &emsp;&emsp;Dubbo *|ˈdʌbəʊ|* 是一个由阿里巴巴开发的高性能的基于RPC的java开源框架。在许多的RPC系统，Dubbo是基于服务理念的架构，通过指定他们的参数和返回类型的方法，进行调用。在服务器端，服务器实现此接口，并运行一个Dubbo服务器处理客户端调用。在客户端，客户端有一个存根，它提供与服务器相同的方法。

二、 **Dubbo的架构如下**
![dubbo-architecture.png-75.6kB][6]
&emsp;&emsp; 图6 dubbo架构图
&emsp;&emsp;和SOA框架一样，Registry负责注册服务，并提供发现服务的接口，这个部分现在一般使用zookeeper或者redis来实现了，redis对于快速分布式响应具有更大的潜力，应用实例可参考天猫商场双十二秒杀系统的实现。Provider即服务的提供者，负责核心业务层逻辑的运行和与数据源的交互。Monitor是不同于以往的SOA的部分，统计服务的调用次数和调用时间的日志服务称之为“服务监控中心”，之后会重点讨论。Consumer是主要调用服务Provider的一方，主要负责处理与前端交互的部分。
&emsp;&emsp;Dubbo提供了三个关键功能，包括远程调用接口、容错和负载平衡，和自动服务注册与发现。Dubbo框架被广泛采用阿里巴巴内部和外部的其他公司包括京东、当当网、去哪儿、考拉，和许多其他公司。

三、**Monitor服务监控中心**
Monitor的作用非常明确，就是监控服务的运行，包括Provider和Consumer部分。有以下几个性质：
1. 连通性
&emsp;&emsp;注册中心负责服务地址的注册与查找，相当于目录服务，服务提供者和消费者只在启动时与注册中心交互，注册中心不转发请求，压力较小。监控中心负责统计各服务调用次数，调用时间等，统计先在内存汇总后每分钟一次发送到监控中心服务器，并以报表展示服务提供者向注册中心注册其提供的服务，并汇报调用时间到监控中心，此时间不包含网络开销服务消费者向注册中心获取服务提供者地址列表，并根据负载算法直接调用提供者，同时汇报调用时间到监控中心，此时间包含网络开销注册中心，服务提供者，服务消费者三者之间均为长连接，监控中心除外。注册中心通过长连接感知服务提供者的存在，服务提供者宕机，注册中心将立即推送事件通知消费者。注册中心和监控中心全部宕机，不影响已运行的提供者和消费者，消费者在本地缓存了提供者列表。注册中心和监控中心都是可选的，服务消费者可以直连服务提供者。
2. 健壮性
&emsp;&emsp;监控中心宕掉不影响使用，只是丢失部分采样数据。数据库宕掉后，注册中心仍能通过缓存提供服务列表查询，但不能注册新服务。注册中心对等集群，任意一台宕掉后，将自动切换到另一台
注册中心全部宕掉后，服务提供者和服务消费者仍能通过本地缓存通讯。服务提供者无状态，任意一台宕掉后，不影响使用。服务提供者全部宕掉后，服务消费者应用将无法使用，并无限次重连等待服务提供者恢复
3. 伸缩性
&emsp;&emsp;注册中心为对等集群，可动态增加机器部署实例，所有客户端将自动发现新的注册中心。服务提供者无状态，可动态增加机器部署实例，注册中心将推送新的服务提供者信息给消费。

## 捌、参考文献 ##
1. 李庆,钟宝荣.面向服务架构（SOA）研究【R】.长江大学计算机科学学院研究生院.2011.
2. 吴家菊,刘刚,席传裕.基于Web服务的面向服务（SOA）架构研究【J】.现代电子技术.2005.
3. 李智慧.大型网站技术架构【J】.电子工业出版社.2013.
4. 岳昆,王晓玲,周傲英.Web服务核心支撑技术：研究综述【J】.软件学报.2004.
5. 李培松,刘觉夫.基于WebService的面向服务架构（SOA）的研究【J】.华东交通大学学报.2007.
6. Kai Hwang Geoffey C.Fox,Jack J. Dongarra.云计算与分布式系统【M】.机械工业出版社.2016.
7. 胡启敏,薛锦云,种林辉.基于Spring框架的轻量级J2EE架构与应用【J】.计算机工程与应用.2008.
8. 高瑞林.Spring框架原理【N】.cnblogs.2010.
9. Chandler Qian.Spring Bean的生命周期【N】.cnblogs.2014.
10. tony.Spring：源码解读SpringIOC设计原理【N】.博客小屋.2012.


  [1]: /assets/blogImg/blog-SOA-archi.JPG
  [2]: /assets/blogImg/blog-SOA-threeArchi.jpg
  [3]: /assets/blogImg/blog-SOA-serviceCreating.JPG
  [4]: /assets/blogImg/blog-SOA-javaBean-lifeTime.png
  [5]: /assets/blogImg/blog-SOA-beanFactory.png
  [6]: /assets/blogImg/dubbo-architecture.png
  [7]: /assets/blogImg/blog-SOA-mainTheme.jpg
