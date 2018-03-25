---
title: Zero-Shot Learning(the state of art) 
date: 2018-03-12 08:20:07
toc: true
tags:
    - 论文
    - python
---
![ZSC封面][1]

# 零样本分类-ZSC
> 本博客来源于对Web Of Science的论文《Combining ontology and reinforcement learning for zero-shot classification》的翻译与理解。

## 前言
&emsp;&emsp;零样本分类（Zero-Shot Classification，ZSC）是计算机视觉的研究热点，不同于传统的机器学习，ZSC使用的学习样本集于测试样本集是完全不同的。发展ZSC可以很大程度扩展机器学习解决现实问题的能力。举个例子，我们很难获得大量具有标签的特殊类型的数据，因为对象的类别可能是数量巨大的，甚至有一些的类别定义一直在变化(on the fly)。ZSC将有望在这个领域发挥作用。

<!-- more -->

> 目前对于机器学习而言，其实本质上仍然是“你的训练结果会和你的数据集一样好”的情况，提高数据集的质量可以很大程度提高训练的结果。然而，获得大量有标签的数据是非常耗费人力物力的，目前解决这个办法的另一个方案是把人的因素考虑在内，利用人的鉴别能力预先给物体贴标签，即Human in Loop。通过金钱等方式让人参与到机器学习的底层来，当然这非常不“智能”，目前很多言论都在说机器学习需要更多人力的原因就在于此。

&emsp;&emsp;传统的分类方法，如支持向量机（Support Vector Machine）、贝叶斯分类器都无法解决ZSC，因为测试样本集合（见过的集合）相当不同于训练集合（未见过的集合）。零样本学习（ZSC）有望解决这个问题。很长一段时间，基于属性的ZSC方法被认为有望解决ZSC问题。属性知识（Attribute Knowledge）被用于从见过的类别中学习描述未见过的类别，这些知识即关于属性的迁移知识（transferring knowledge）。基于属性的方法现在在ZSC中已经非常广泛，其中有
&emsp;&emsp;1. **直接属性预测（Direct Attribute Prediction）**
&emsp;&emsp;2. **间接属性预测（Indirect Attribute Prediction)**
&emsp;&emsp;他们认为通过人类的先验知识（Prior Knowledge）和数据分析以及训练从图片中提取的低等级特征构建的属性预分类器（Attribute Predictors）可以获得对象属性标注。

&emsp;&emsp;不是所有的属性在ZSC中都有作用的。选择最好的属性组合对ZSC是有益的。能从数据集中分辨出一组类别的属性被称为**有助于判别的属性（Discriminative Attributes,DA**），**无助于判别的属性（Non-discriminative Attributes,NDA）**在ZSC中是没用的，最好能排除他们。当然，不是所有的**DA**都具备相同的分辨不同类别的能力，所以应当被区别对待。例如，**CAAP（Class-Attribute Association Prediction）**类-属性的关联预测，可分辨出积极相关还是消极相关的**DA**和未见过的类别（unseen classes）。扩充未见过的类别描述将使得CAAP对于ZSC变得更难、更富挑战。本研究将展示搜寻与未见过的类别相关的属性，并据此提升基于属性的零样本分类器的性能。

&emsp;&emsp;**层次化（Hierarchy）**是另一种先验知识，同样有利于ZSC。使用层次化的先验知识可以比不适用层次化的方法获得更高的精确度。**AHLE（Attribute and Hierarchy Label Embedding）** and **SJE（Structed Joint Embedding）**以不同的方式利用层次化从中提取类作为附加信息。比起缺乏层次化知识的方法，他们实现了更高精度的ZSC。**HAT（Hierachical Attribute Transfer）**是另一种基于属性的分类器，通过训练属性预测器在不同的层次化抽象等级上提升精度。在测试时，它使用属性预测器在不同抽象等级上预测每个属性值。最终，它将依据分数返回一个分类结果。因此，在不同抽象等级的属性对ZSC的贡献是完全不同的。然后，在HAT中的可适应权重无法解决区分不同贡献的属性的问题。

## CORL(Combining Ontology and Reforcement Learning)
&emsp;&emsp;在本论文中，我们提出了一个方法，**CORL（Combining Ontology and Reinforcement Learning）结合本体和强化学习的方法** 。通过引入***'Hierachical Classification Rule(HCR)'*** 层次化分类规则和价值函数Q评价HCRs，CORL可以运用强化学习进行ZSC。CORL有两个学习阶段：
1. 在训练阶段，CORL从本体的属性注解得到指导。从每个属性中训练出一个预测器。这将能从图片的低等级的特征中预测物体的特性。
2. 在测试阶段，物体的属性将被预测和作为一个先决条件来选择HCRs。ε-greedy贪心策略在强化学习中被用于选择HCRs（层次上满足分类物体的先决条件）。价值函数，Q，是由分类反馈的蒙特卡罗（Monte Carlo，MC）强化学习方法决定的。ε-greedy贪心策略对于HCR选择随着Q的更新会不断调整和优化。

&emsp;&emsp;本论文提供了两个比较重要的贡献。首先，HCR的提出和从属性注解中构建本体指导HCR的学习。HCR提高先验知识的表达不同于目前的层次化知识的表示，是基于强化学习的更加灵活的部署。然后，MC 强化学习的方法非常适用于HCR的自适应优化策略。结果将导致，只有最佳可判别的HCRs会被使用，将实现更高的ZSC精确度。

&emsp;&emsp;实验基于benchmarkZSC训练集合，**O-ZSC**(此方法分类物体仅仅采用HCRs而未采用强化学习)基于DAP使用很少的属性达到其精确结果。CORL通过使用强化学习的自适应的HCRs实现更高的精确度。实验验证了CORL的强化学习是收敛的。CORL是优于baseline的零样本分类器中的3个广泛采用的ZSC方法的。

## 相关工作
&emsp;&emsp;使用在见过的分类和未见过的分类的共有属性用于分类未见过的样本，是解决ZSC的一个非常重要的方法。

![CORL过程][2]

## 提出方法
&emsp;&emsp;CORL结合了本体和强化学习，CORL的概览请参考上图。
&emsp;&emsp;CORL有两个学习阶段，阶段1以黑色箭头显示（step1 和 2）。在阶段1中，HCRs从属性注解中基于本体学习。在阶段2中，一个训练好的预测器对每个出现在HCRs中的属性使用SVM和从训练的图片中抽取低等级的特征。阶段2有3个步骤用红色箭头显示（step3,4,5）。在阶段2中，MC强化学习的方法作为优化策略被用于优化HCRs的选则上。因为对象在测试图片中已经分类过，它们的属性使用属性预测器进行预测，然后在step3从图片中抽取低等级的特征。在step4中，贪心策略选择了一个HCRs的集合，满足对象属性的层次化划分。最终，step5中，来自分类结果的反馈被用于自适应调整每个可选择的HCR的可判断程度（Discriminative degree）。

### 训练属性预测器
&emsp;&emsp;ZSC和属性标注

**定义 1** （Zero-Shot Classification, ZSC）.给定一个对象类别集合<img src="http://latex.codecogs.com/gif.latex?  C=\{c_1,c_2,...,c_n\} "/>，这个集合的训练集合为<img src="http://latex.codecogs.com/gif.latex? Y = \{y_1,y_2,...,y_k\}"/>，和类别集合的测试集合<img src="http://latex.codecogs.com/gif.latex? Z=\{z_1,z_2,...,z_l\}"/>，当<img src="http://latex.codecogs.com/gif.latex? Y \cap Z = \varnothing, and Y \cup Z = C"/>。一个训练集合包含Y中被标记的样本，但是不包含Z中被标记的样本。这种分类任务叫做ZSC。
&emsp;&emsp;“relative strength of association”相对关联强度是描述哺乳动物和他们的语义属性的相关性的。一个由相对关联强度组成的矩阵在ZSC的对象类别和语义属性被称作“attribute annotation of object classes”对象类别的属性注解。它可以被用来当做在ZSC中的人类的先验知识。一个属性注解是一个对象类别（以属性集合组成）的描述。

**定义2** （Attribute Annotation of Object Classes）。给定一个对象类别的集合<img src="http://latex.codecogs.com/gif.latex? C=\{c_1,c_2,...,c_n\}"/>和属性集合<img src="http://latex.codecogs.com/gif.latex? A=\{a_1,a_2,...,a_m\}"/>,一个对象的类别<img src="http://latex.codecogs.com/gif.latex? c_j \in C"/>可以被描述为一个m维度的向量<img src="http://latex.codecogs.com/gif.latex? V_j = \{v_{j1},v_{j2},...,v_{jm}\}(v_{ji} \in [0,1], 1 \le i \le m)"/>值<img src="http://latex.codecogs.com/gif.latex? v_{ji}"/>在向量<img src="http://latex.codecogs.com/gif.latex? \mathrm v_j"/>代表相对相关强度在对象类别<img src="http://latex.codecogs.com/gif.latex? c_j"/>和属性<img src="http://latex.codecogs.com/gif.latex? a_i"/>中。使<img src="http://latex.codecogs.com/gif.latex? V = (v_1,v_2,...,v_n)^\mathrm T"/>以及<img src="http://latex.codecogs.com/gif.latex? C=(c_1,c_2,...,c_n)^\mathrm T"/>然后用<img src="http://latex.codecogs.com/gif.latex? (\mathrm V, \mathrm C)"/>代表对象类别的属性标签。

&emsp;&emsp;使<img src="http://latex.codecogs.com/gif.latex? F_{train}"/>成为由<img src="http://latex.codecogs.com/gif.latex? \alpha-dimensional"/>从训练图片中抽取的低等级图片的特征组成的矩阵。在DAP中，属性预测器可以使用<img src="http://latex.codecogs.com/gif.latex? (\alpha + 1)-dimensional"/>的训练数据<img src="http://latex.codecogs.com/gif.latex? (F_{train},Y_{train})"/>和属性注解<img src="http://latex.codecogs.com/gif.latex? \mathrm v"/>。对于一个属性，<img src="http://latex.codecogs.com/gif.latex? a_i \in A(1 \le i \le m)"/>，训练数据<img src="http://latex.codecogs.com/gif.latex? (F_{train},V_{train}^i)"/>，构建<img src="http://latex.codecogs.com/gif.latex? a_i^{'}S"/> 预测器可以从 <img src="http://latex.codecogs.com/gif.latex? Y_{train} \text{ with } v_{ji}"/>替换得到（<img src="http://latex.codecogs.com/gif.latex? v_{ji} \text{ with } y_j \text{ and } a_i"/>是相对关联强度）。方法<img src="http://latex.codecogs.com/gif.latex? fun_{a_i}:f \to v (f \in R^\alpha,v \in [0,1])"/>以SVM<img src="http://latex.codecogs.com/gif.latex? (F_{train},v_{train}^i)"/>构建，作为<img src="http://latex.codecogs.com/gif.latex? a_i"/>的预测器。然而，一个对象的<img src="http://latex.codecogs.com/gif.latex? a_i"/>值可以使用<img src="http://latex.codecogs.com/gif.latex? fun_{a_i}"/>从<img src="http://latex.codecogs.com/gif.latex? \alpha-dimensinal"/>预测。使用CORL的属性预测器即可从上述过程中构建。

### 学习层次化分类的规则(HCRs)

## 具体算法实现 ##
**算法 1**
OntoGuided_Rule_Learning(taxo,ds,cls)
**/\*learn HCRs of cls from dataset ds guided by the taxonomy in CO\*/**
___
**Input:** Taxonomy taxo, DataSet ds,Root cls<img src="http://latex.codecogs.com/gif.latex? \leftarrow"/>"root"
**Output:** RuleSet rs <img src="http://latex.codecogs.com/gif.latex? \leftarrow \varnothing"/>

1. <img src="http://latex.codecogs.com/gif.latex? tmpDS \leftarrow copy(ds),sub \leftarrow getSubCls(taxo,cls);"/> //create a copy of ds & get direct subclasses of cls
**/\*steps 2-7:replace instance' labels of whom cls is a super-class to cls's direct subclass and remove instances whose label is not a subclass of cls\*/**
2. **for each** <img src="http://latex.codecogs.com/gif.latex? \text{inst} \in tmpDS"/> **do**
3. &emsp;&emsp;&emsp;&emsp;<img src="http://latex.codecogs.com/gif.latex? lbl_{set} \leftarrow subs \cap 4. getSuperClasses(taxo,labelOf(inst));"/> // obtain super-class of inst's label in subs
4. &emsp;&emsp;&emsp;&emsp;**if** <img src="http://latex.codecogs.com/gif.latex? lbl_{set} = \varnothing"/> **then** <img src="http://latex.codecogs.com/gif.latex? inst.label \leftarrow getAnElement(lbl_{set});"/> // replace label guided by the hierachy
5. &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;**else** <img src="http://latex.codecogs.com/gif.latex? tmpDS \leftarrow tmpDS_{inst}"/>
6. &emsp;&emsp;&emsp;&emsp;**end if**
7. **end for**
8. <img src="http://latex.codecogs.com/gif.latex? attrs_{set} \leftarrow \varnothing, ml_rules \leftarrow \varnothing"/>;
9. **repeat** /\*step 9-12：learning rules with different attributes/\*
10. <img src="http://latex.codecogs.com/gif.latex? attrs_{set} \leftarrow attrs_{set} \cup attributesInRules(ml_{rules})"/> \\exclude attributes already in rules
11. <img src="http://latex.codecogs.com/gif.latex? ml_rules \leftarrow CR_{learning}(tmpDS,attrs_{set})"/>//learning rules without using attributes in attrs_set
12. **until** <img src="http://latex.codecogs.com/gif.latex? ml_{rules} = \varnothing"/>//some rules are learned using new attributes
/\* step 13-16: form HCRs deriving cls's subclass(r's head)from cls\*/
13. **for each** <img src="http://latex.codecogs.com/gif.latex? r \in ml_{rules}"/> **do**
14. <img src="http://latex.codecogs.com/gif.latex? hcr \leftarrow formHCR(r,cls)"/>; // add class = cls to the antecedents of r to form the HCR
15. <img src="http://latex.codecogs.com/gif.latex? rs \leftarrow rs \cup \{hcr\}"/>；//add onto_rule to the rules set rs
16. **end for**
/\*steps 17-20: hierachical learning: learning rules for cls's subclasses\*/
17. <img src="http://latex.codecogs.com/gif.latex? tmpDS1 \leftarrow copy(ds)"/>；//create a new copy of ds for learning
18. **for each** <img src="http://latex.codecogs.com/gif.latex? sub \in subs"/> **do**
19. &emsp;&emsp;&emsp;&emsp;<img src="http://latex.codecogs.com/gif.latex? rs \leftarrow rs \cup OntoGuided_{Rule}^{Learning}(taxo,tmpDS1,sub)"/>；
20. **end for**

** 算法1 ** 
使用公理taxo从训练数据中产生cls的HCRs。首先，预处理过程的数据来自学习本地分类器。在步骤2-7中，在ds中的标签被他们在cls‘s的直接子类的超类所替代。只有标签是cls的直接子类的样例保留，用于产生cls的HCRs。然后，只有cls的有助于判定的直接子类分类器会在步骤9-12上被接受。大量的cls分类器通过使用不同的属性集合在步骤9-12中被构建。

  [1]: /assets/blogImg/blog-ZSC-background.jpg
  [2]: /assets/blogImg/blog-ZSC-paperImg.JPG