---
title: DUBBO的配置与使用手册
date: 2018-03-01 15:35:33
toc: true
tags:
    - 技术
    - Dubbo
---
![Dubbo封面][2]

# **简介** #
> &emsp;&emsp;***a high-performance.java basesd,open source RPC framework.***
> &emsp;&emsp;Dubbo *|ˈdʌbəʊ|* 是一个由阿里巴巴开发的高性能的基于RPC的java开源框架。在许多的RPC系统，Dubbo是基于服务理念的架构，通过指定他们的参数和返回类型的方法，进行调用。在服务器端，服务器实现此接口，并运行一个Dubbo服务器处理客户端调用。在客户端，客户端有一个存根，它提供与服务器相同的方法。

<!-- more -->
# **Dubbo的架构如下** #
![Dubbo的架构示意图][1]
&emsp;&emsp;Dubbo提供了三个关键功能，包括远程调用接口、容错和负载平衡，和自动服务注册与发现。Dubbo框架被广泛采用阿里巴巴内部和外部的其他公司包括京东、当当网、去哪儿、考拉，和许多其他公司。
# **Dubbo运行环境** #
- JDK: version 6 or higher
- Maven: version 3 or higher
- Tomcat: version 6 or higher

# **dubbo的开发环境部署** #
## **简单环境的配置（一体式）** ##
**本配置需要以下环境的正确安装与配置：**

- JDK的安装与环境配置；
- 安装Eclipse；
- 安装Maven，并在Eclipse中配置Maven插件；
- 安装Redis作为服务注册（也可以选择zookeeper）；

首先创建一个Maven工程，然后配置pom.xml文件
**pom.xml**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>

	<groupId>com.example</groupId>
	<artifactId>OceanArtifact</artifactId>
	<version>0.0.1-SNAPSHOT</version>

	<name>OceanArtifact</name>
	<description>Demo project for Spring Boot</description>

	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>1.5.9.RELEASE</version>
		<relativePath /> <!-- lookup parent from repository -->
	</parent>

	<properties>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
		<java.version>1.8</java.version>
	</properties>

	<dependencies>
		<!--spring -->
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-redis</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web-services</artifactId>
		</dependency>

		<dependency>
			<groupId>mysql</groupId>
			<artifactId>mysql-connector-java</artifactId>
			<scope>runtime</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-tomcat</artifactId>
			<scope>provided</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-test</artifactId>
			<scope>test</scope>
		</dependency>
		<!--spring end -->

		<!--dubbo -->
		<dependency>
			<groupId>com.alibaba</groupId>
			<artifactId>dubbo</artifactId>
			<version>2.6.0</version>
		</dependency>
		<!--dubbo end -->

		<!--dubbo相关依赖 -->
		<dependency>
			<groupId>org.apache.commons</groupId>
			<artifactId>commons-pool2</artifactId>
		</dependency>
		<dependency>
			<groupId>commons-httpclient</groupId>
			<artifactId>commons-httpclient</artifactId>
			<version>3.1</version>
		</dependency>
		<dependency>
			<groupId>redis.clients</groupId>
			<artifactId>jedis</artifactId>
		</dependency>
		<dependency>
			<groupId>com.thoughtworks.xstream</groupId>
			<artifactId>xstream</artifactId>
			<version>1.4.1</version>
		</dependency>
		<dependency>
			<groupId>com.alibaba</groupId>
			<artifactId>fastjson</artifactId>
			<version>1.2.33</version>
		</dependency>
		<dependency>
			<groupId>org.jfree</groupId>
			<artifactId>jfreechart</artifactId>
			<version>1.0.19</version>
		</dependency>
		<dependency>
			<groupId>com.caucho</groupId>
			<artifactId>hessian</artifactId>
			<version>4.0.7</version>
		</dependency>
		<dependency>
			<groupId>org.apache.curator</groupId>
			<artifactId>curator-recipes</artifactId>
			<version>3.3.0</version>
		</dependency>
		<dependency>
			<groupId>org.apache.cxf</groupId>
			<artifactId>cxf-rt-frontend-jaxws</artifactId>
			<version>2.6.1</version>
		</dependency>
		<dependency>
			<groupId>org.apache.thrift</groupId>
			<artifactId>libthrift</artifactId>
			<version>0.8.0</version>
		</dependency>
		<!--dubbo相关依赖结束 -->

		<!--日志服务logback 开始 -->
		<dependency>
			<groupId>ch.qos.logback</groupId>
			<artifactId>logback-core</artifactId>
		</dependency>
		<dependency>
			<groupId>ch.qos.logback</groupId>
			<artifactId>logback-classic</artifactId>
		</dependency>
		<!--日志服务logback 结束 -->

		<!-- jetty -->
		<dependency>
			<groupId>org.mortbay.jetty</groupId>
			<artifactId>jsp-2.1-glassfish</artifactId>
			<version>9.1.02.B04.p0</version>
		</dependency>
		<dependency>
			<groupId>org.eclipse.jetty</groupId>
			<artifactId>jetty-servlet</artifactId>
		</dependency>
		<dependency>
			<groupId>org.eclipse.jetty</groupId>
			<artifactId>jetty-server</artifactId>
		</dependency>

		<dependency>
			<groupId>org.eclipse.jetty</groupId>
			<artifactId>jetty-websocket</artifactId>
			<version>8.1.11.v20130520</version>
		</dependency>

		<dependency>
			<groupId>org.eclipse.jetty</groupId>
			<artifactId>jetty-webapp</artifactId>
		</dependency>
		<!-- jetty end -->
	</dependencies>

	<build>
		<plugins>
			<plugin>
				<groupId>org.mortbay.jetty</groupId>
				<artifactId>jetty-maven-plugin</artifactId>
				<version>8.1.11.v20130520</version>
				<configuration>
					<webApp>
						<contextPath>/</contextPath>
					</webApp>
					<scanIntervalSeconds>3</scanIntervalSeconds>
					<connectors>
						<connector implementation="org.eclipse.jetty.server.nio.SelectChannelConnector">
							<port>8010</port>
							<maxIdleTime>400000</maxIdleTime>
						</connector>

					</connectors>
				</configuration>
			</plugin>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-compiler-plugin</artifactId>
				<configuration>
					<verbose>true</verbose>
					<fork>true</fork>
					<executable>${JAVA8_HOME}/bin/javac</executable>
				</configuration>
			</plugin>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
			</plugin>
		</plugins>

	</build>
</project>
```
&emsp;&emsp;按上述内容配置pom.xml并启用Maven编译，这时会将配置的jar包下载到.m2的文件夹中。此时，这些jar包就能在工程中被引用了。
首先，我们要声明暴露的服务方法的接口
** DemoTestService.java **
```java
package university.shou.oceanArtifacts.service;

public interface DemoTestService {
	public String test();
}
```
&emsp;&emsp;这样我们就声明了一个接口，接口里定义需要暴露给*消费者* **Consumer**的方法。另外，如果这个方法需要传递参数，或者返回参数，那么这个参数（**对象**）必须是序列化的（**实现Serializable接口**），因为未序列化的对象无法在网络中传输。

然后，我们需要实现这个接口，定义它的方法
** DemoTestServiceImpl.java **
```java
package university.shou.oceanArtifacts.service.impl;

import university.shou.oceanArtifacts.service.DemoTestService;

public class DemoTestServiceImpl implements DemoTestService {

	@Override
	public String test() {
		return "hello";
	}

}
```
&emsp;&emsp;这里仅仅是写一个实体类实现这个接口，并赋予它行为。

然后我们需要配置服务，将这个功能发布出来供其他服务调用
**consumer.xml**
```xml
<?xml version="1.0" encoding="UTF-8"?>

<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans        http://www.springframework.org/schema/beans/spring-beans.xsd        http://code.alibabatech.com/schema/dubbo        http://code.alibabatech.com/schema/dubbo/dubbo.xsd">
       <!-- 消费方应用名，用于计算依赖关系，不是匹配条件，不要与提供方一样 -->
       <dubbo:application name="constomer-of-oceanArtifact-app" />
       <!-- 使用redis注册中心暴露发现服务地址 -->
       <dubbo:registry address="redis://localhost:6379"/>
       <dubbo:protocol name="dubbo" port="20880" />
       <!-- 生成远程服务代理-->
       <dubbo:service interface="university.shou.oceanArtifacts.service.DemoTestService" ref="DemoTestService"></dubbo:service>

       <bean id="DemoTestService" class="university.shou.oceanArtifacts.service.impl.DemoTestServiceImpl"></bean>
</beans>
```
&emsp;&emsp;这里我们采用Redis作为服务注册，也就是将我们的服务统一注册在Redis上（Redis和MangoDB类似，非关系型数据库）。然后定义我们服务提供的端口号20880（同一个服务器上不能相同），然后定义引用的接口和对外暴露的接口名称。然后，定义实现该接口的实体类。

把服务发布上去
**Consumer.java**
```java
package com.example.demo;

import org.springframework.context.support.ClassPathXmlApplicationContext;

public class Customer {
	private static ClassPathXmlApplicationContext context;

	public static void main(String[] args) throws Exception {
        context = new ClassPathXmlApplicationContext("classpath:customer.xml");
        context.start();
    }
}

```
&emsp;&emsp;依据部署的xml文件启动起来。

调用该服务
** ArticleController.java **
```java
package university.shou.oceanArtifacts.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import com.alibaba.dubbo.common.logger.Logger;
import com.alibaba.dubbo.common.logger.LoggerFactory;

import university.shou.oceanArtifacts.service.DemoTestService;

@Controller
public class ArticleController {
    private static final Logger LOGGER = LoggerFactory.getLogger(ArticleController.class);

    @Autowired
    private DemoTestService articleService;

    @RequestMapping(value = "/article/info")
    String get(Model model){
        LOGGER.info("hello ocean artifact");
        String hello = articleService.test();
        model.addAttribute("info",hello);
        return "/info";
    }
}

```
&emsp;&emsp;调用该服务，然后我们启动jetty插件。在浏览器中输入网址http://localhost:8010/article/info

最后我们看一下Dubbo包结构：
![Dubbo包管理][3]

## **中等环境的配置（分离式）** ##
&emsp;&emsp;这里，我们可以利用Dubbo实现一个简单的加、减、乘、除的Provider，做一个小的Demo来练习一下如何搭建Spring-boot + Dubbo的运行环境。首先，同样需要定义一个共同的API接口，提供Provider实例化的模板。先简单定义一个接口，具有加、减、乘、除的方法。
*** 以下工程均以Maven工程创建 ***
** IBasicCalculation.java **
```java
package shou.mathUtil;

import java.math.BigDecimal;

public interface IBasicCalculation {
	public BigDecimal add(BigDecimal num1, BigDecimal num2);
	public BigDecimal sub(BigDecimal num1, BigDecimal num2);
	public BigDecimal mult(BigDecimal num1, BigDecimal num2);
	public BigDecimal div(BigDecimal num1, BigDecimal num2);
}
```
> 这里需要注意一点，接口传入传出的参数，必须要实现了Java的Serializable的接口，即可序列化。因为，未序列化的对象无法在网络上传输。api中如无必要不需要什么外部Jar包的支撑，所以POM文件可以不添加任何的外部引用。

** API包结构一览：**
![API包结构一览][4]

&emsp;&emsp;然后，我们需要写一个Provider实现这个接口中的方法，并且向Redis注册广播我们的服务接口，以便Consumer可以得知并且调用我们的方法。首先，写一个实体类实现这个接口：
** BasicCalculation.java **
```java
package shou.provider.impl;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import com.alibaba.dubbo.config.annotation.Service;

import shou.mathUtil.IBasicCalculation;

@Component("BasicCalculation") 
@Service
public class BasicCalculation implements IBasicCalculation {

	public BigDecimal add(BigDecimal num1, BigDecimal num2) {
		return num1.add(num2);
	}

	public BigDecimal sub(BigDecimal num1, BigDecimal num2) {
		return num1.subtract(num2);
	}

	public BigDecimal mult(BigDecimal num1, BigDecimal num2) {
		return num1.multiply(num2);
	}

	public BigDecimal div(BigDecimal num1, BigDecimal num2) {
		return num1.divide(num2);
	}

}
```
> 只需要实现之前声明的接口，并且加上一些注解类即可。Service标签用于声明这是一个Dubbo服务。

&emsp;&emsp;然后，我们希望可以以Dubbo Main的方式启动这个Provider（这也是官方比较推荐的方式，可以实现优雅关闭）。这里需要注意的是，创建的两个文件applicationContext.xml和polar-dubbo.xml必须放置在resource目录下的spring目录下（没有就创建一个）。
** applicationContext.xml **
```xml
<?xml version="1.0" encoding="UTF-8"?>

<beans xmlns="http://www.springframework.org/schema/beans"  
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"  
       xmlns:context="http://www.springframework.org/schema/context"  
       xsi:schemaLocation="  
          http://www.springframework.org/schema/beans  
          http://www.springframework.org/schema/beans/spring-beans-3.0.xsd  
       http://www.springframework.org/schema/context  
       http://www.springframework.org/schema/context/spring-context-3.0.xsd">  
   
    <!-- 扫描的包的路径 -->
    <context:component-scan base-package="shou.provider.impl" />
   
    <!-- 按照注解进行配置 -->
    <context:annotation-config />  
   
</beans>  
```
** polar-dubbo.xml **
```xml
<?xml version="1.0" encoding="UTF-8"?>

<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
	xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
	xsi:schemaLocation="http://www.springframework.org/schema/beans
    http://www.springframework.org/schema/beans/spring-beans.xsd       
    http://code.alibabatech.com/schema/dubbo        
    http://code.alibabatech.com/schema/dubbo/dubbo.xsd">
	<!-- 提供方应用信息，用于计算依赖关系 -->
	<dubbo:application name="dubbo_provider_polar" />

	<!-- 使用zookeeper注册中心暴露服务地址 -->
	<dubbo:registry address="redis://localhost:6379" />

	<!-- 用dubbo协议在20880端口暴露服务 -->
	<dubbo:protocol name="dubbo" port="20880" />

	<!-- 声明需要暴露的服务接口 -->
	<dubbo:service interface="shou.mathUtil.IBasicCalculation" ref="BasicCalculation" />
	<bean id="BasicCalculation" class="shou.provider.impl.BasicCalculation"></bean>
</beans>  
```
> 以上均有注释，应该不难理解。以上配置，当然需要POM文件的支持，只要添加Dubbo和Spring相关的Jar包就可以了。需要注意一点，必须引入api的Jar包路径。否则，将会提示找不到IBasicCalculation这个接口。

&emsp;&emsp;DubboMain的部分就非常简单了。

** DubboMain.java **
```java
package shou.provider.main;

import java.io.IOException;

import com.alibaba.dubbo.container.Main;

public class DubboMain {
    
    public static void main(String[] args) throws IOException {
        Main.main(args);
    }  
}
```
&emsp;&emsp;把这个直接打成一个Jar包，然后Java -jar 你的Jar包.jar 运行起来，这样在dubbo-admin中就可以看到这个Provider已经注册进去了。我们的第二步就完成了，剩下就是写一个调用这个Provider的Consumer。
** PROVIDER的包结构一览：**
![PROVIDER的包结构一览][5]

&emsp;&emsp;Comsumer的编写分为两个部分。首先，需要写一个Spring-boot的后端调用接口，spring-boot的Controller和mvcConfig部分如下：
** PageController.java **
```java
package shou.consumer.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("")
public class PageController {
	@RequestMapping(value = "/main")
	public String mainPage(Model model) {
		return "index";
	}
}

```
> 这个PageController用于控制页面的跳转，跳转到我们的主页面index.html。这里的配置和spring-boot配置相同，可以参考spring-boot的相关配置，这里就不再赘述了。

** CalController.java **
```java
package shou.consumer.controller;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ImportResource;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.alibaba.dubbo.common.logger.Logger;
import com.alibaba.dubbo.common.logger.LoggerFactory;

import shou.mathUtil.IBasicCalculation;

@RestController
@ImportResource({"polar-consumer.xml"}) 
@RequestMapping("")
public class CalController {
	public static final Logger LOGGER = LoggerFactory.getLogger(CalController.class);
	
	@Autowired
	private IBasicCalculation calculation;
	
	@RequestMapping(value = "/BasicCalculation/{way}/{num1}/{num2}", method = RequestMethod.GET)
	public String calculate(@PathVariable String way, @PathVariable String num1, @PathVariable String num2) {
		BigDecimal num1_de = new BigDecimal(num1);
		BigDecimal num2_de = new BigDecimal(num2);
		if ("add".equals(way)) {
			return calculation.add(num1_de, num2_de).toString();
		} else if ("sub".equals(way)) {
			return calculation.sub(num1_de, num2_de).toString();
		} else if ("mult".equals(way)) {
			return calculation.mult(num1_de, num2_de).toString();
		} else if ("div".equals(way)) {
			return calculation.div(num1_de, num2_de).toString();
		}
		return "";
	}
}
```
> CalController用于提供加、减、乘、除的接口，便于之后使用jQuery的ajax调用这个接口实现简单的计算。注意，这里的ImportResource引用了resource下的dubbo配置文件，是为了可以自动实现对IBasicCalculation的自动实例化的，这些部分都交由dubbo的框架实现。polar-consumer.xml的配置文件内容如下：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
	xsi:schemaLocation="http://www.springframework.org/schema/beans  
        http://www.springframework.org/schema/beans/spring-beans.xsd  
        http://code.alibabatech.com/schema/dubbo  
        http://code.alibabatech.com/schema/dubbo/dubbo.xsd  
        ">
    <!-- 声明调用的提供方的服务和实现的接口 -->
    <dubbo:reference interface="shou.mathUtil.IBasicCalculation" check="false" id="BasicCalculation" />

	<!-- 消费方应用名，用于计算依赖关系，不是匹配条件，不要与提供方一样 -->
	<dubbo:application name="polar_consumer_original" />

	<dubbo:registry address="redis://localhost:6379" />
</beans>  
```
> 另外，** application.properties **的配置如下：
server.port=8081  // 使用8081端口启动(如果打成war包运行，建议删除)
spring.thymeleaf.prefix=classpath:/templates/
spring.thymeleaf.cache=false

** WebMvcConfigurerAdapter.java **
```java
package shou.consumer;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;
import org.springframework.web.servlet.view.InternalResourceViewResolver;
import org.springframework.web.servlet.view.JstlView;

@Configuration
@EnableWebMvc
public class MvcConfig extends WebMvcConfigurerAdapter {
	@Bean
	public InternalResourceViewResolver viewResolver() {
		InternalResourceViewResolver viewResolver = new InternalResourceViewResolver();
		viewResolver.setPrefix("/WEB-INF/classes/templates");
		viewResolver.setSuffix(".html");
		viewResolver.setViewClass(JstlView.class);
		return viewResolver;
	}

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		registry.addResourceHandler("/static/**").addResourceLocations("classpath:/static/");
	}
}
```
> 这里主要设置mvc的访问权限。

&emsp;&emsp;然后，我们需要一个前端页面调用我们提供的接口。这里，我们采用JQuery框架调用后端的接口。
** index.html **
```html
<!DOCTYPE html>
<!-- 注意： -->
<html>
<head>
<title>Ocean Artifact</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
<script type="text/javascript" src="static/js/jquery-3.3.1.min.js"></script>
<script type="text/javascript" src="static/js/main.js"></script>
</head>
<body>

输入算式: <input id="num1" type="text"/>
<select id="way">
  <option value ="add">+</option>
  <option value ="sub">-</option>
  <option value="mult">*</option>
  <option value="div">/</option>
</select>
<input id="num2" type="text"/>
<button onclick="calculation()">计算结果</button>
<h2 id="result"></h2>

</body>
</html>
```
> 这个页面中，我们写了两个输入框和一个下拉框，用于输入两个操作数和选择对他们的计算方式。点击按钮将运行绑定在main.js中的方法进行运算，并返回计算的结果。计算的结果显示在h2的标签中。这里需要注意的是，所有的html的标签必须闭合，否则则需要在properties中添加LEGACY的配置。

** main.js **
```javascript
function calculation() {
	var way = $("#way").val();
	var num1 = $("#num1").val();
	var num2 = $("#num2").val();
	$.ajax("/BasicCalculation/" + way + "/" + num1 + "/"+ num2).done(function(result) {
		$("#result")[0].innerHTML = result;
	});
}
```
> 这里的部分就非常简单了，只是用JQuery获取前端的数据并使用ajax调用后端的接口获取计算的结果。

&emsp;&emsp;SpringBoot的初始化部分的主函数如下：
```java
package shou;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.support.SpringBootServletInitializer;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Controller;

@Configuration
@EnableAutoConfiguration
@ComponentScan({"shou.*"})
@SpringBootApplication
@Controller
public class OceanArt extends SpringBootServletInitializer {
	
	public static void main(String[] args) throws Exception {
		SpringApplication.run(OceanArt.class, args);
	}
}
```

CONSUMER的包结构如下：
![CONSUMER的包结构一览][6]

&emsp;&emsp;按上述完成之后，打包成Jar包就可以直接启动，并在dubbo控制台中看到Consumer已经被启动起来了，访问 http://localhost:8081/main 就可以直接打开index.html的页面，并输入数值运算两个数值的运算结果了。至此，一个简单的分布式的dubbo框架就建立起来了。

# **dubbo控制台在tomcat上的部署** #
## **操作步骤** ##
1. 确认JDK环境配置正确，并下载安装tomcat;
2. 下载dubbo-admin的war包;
3. 将dubbo-admin-x.x.x.war直接放在webapps文件夹下;
4. 双击startup.bat启动tomcat，浏览器地址栏输入localhost:8080/dubbo-admin进入登录界面，输入用户名root，密码root，进入界面。
**PS：另外，在webapps\dubbo-admin\WEB_INF下有一个dubbo.properties，可用来修改登录信息，dubbo地址和端口。**

# **可能存在的问题** #
- 命令行startup.bat的时候，无法启动，命令行窗口显示5行“Using.........”字样，显示的是JDK和tomcat的环境变量信息，没有其他信息了。
***解决办法：*** cmd中输入catalina.bat run，显示错误信息，提示JVM内存设置错误，这个一般是由于之前设置过tomcat参数。用notepad打开catalina.bat文件，大概在186行rem ----- Execute The Requested Command ---------------------------------------下面有之前的设置，屏蔽掉。重新启动startup.bat后问题解决。
- tomcat启动到一半的时候，停止在starting zkclient event thread不动。
***解决办法：***这是由于zookeeper没有启动，启动zkServer.cmd就好了。
- 默认dubbo-admin的注册是基于zookeeper的，如果采用redis作为注册服务而没有安装zookeeper，可能会导致Tomcat报错而无法启动。
***解决办法：*** 进入Tomcat/webapps下解压过的dubbo-admin-XXX\WEB-INF中，打开dubbo.properties，更改dubbo.registry.address=redis://127.0.0.1:6379。然后，重启Tomcat即可。

  [1]: /assets/blogImg/dubbo-architecture.png
  [2]: /assets/blogImg/dubbo-face.jpg
  [3]: /assets/blogImg/blog-dubbo-2018-3-1.jpg
  [4]: /assets/blogImg/blog-dubbo-api.JPG
  [5]: /assets/blogImg/blog-dubbo-provider.JPG
  [6]: /assets/blogImg/blog-dubbo-consumer.JPG
