## Note on [Scaling Dimension and beyond] (2025.10.2)

### 1. What is scaling dimension?

在二级相变（continuous phase transition）里, 我们熟悉的通常是临界指数$\nu, \beta, ...$

这些临界指数在场论语言里都对应着某些算符的“缩放维数”**（scaling dimension）**

如果一个算符$\mathcal{O}(x)$在尺度变换$x \to b x$ 下的变换是
$$
\mathcal{O}(x) \to b^{-\Delta}  \mathcal{O}(bx),
$$
那么 $\Delta$ 就叫做该算符的 **scaling dimension**。

> 物理直觉：它告诉你这个算符“有多 relevant/irrelevant”。如果 (\Delta) 小于空间维度 (d)，算符就是相关的 perturbation，能驱动相变。

在CFT里，实际上对称性是conformal invariance， 比尺度不变性更大。

在 (d=2) 维 CFT 中，每个局域算符用两个指标标记：holomorphic 维数 (h) 和 antiholomorphic 维数 (\bar{h})。



总的 scaling dimension 就是
\[
\Delta = h + \bar{h},
\]
  而自旋是 \(s = h - \bar{h}\)。

>  两点关联函数因此具有固定的幂律形式：
> $$
> \langle \mathcal{O}(x) , \mathcal{O}(0) \rangle \sim \frac{1}{|x|^{2\Delta}}.
> $$

 **例子**

对于由算符 \(\mathcal{O}\) 驱动的扰动，关联长度的指数是
$$
\nu = \frac{1}{d - \Delta_{\mathcal{O}}}.
$$
在 Ising 里，\(\Delta_\epsilon = 1\)，空间维度\(d=2\)，所以 $\nu = 1$

> 所以“\(\nu=1\) 意味着是 \(\epsilon\) 主导”其实是在说：
>
> - 临界点附近，最 relevant 的扰动不是 \(\sigma\)（它需要外磁场才会被打开），
>
> - 而是 \(\epsilon\)，它对应于温度偏离临界点的物理过程。
>
> - 这个算符的 scaling dimension 决定了关联长度如何发散，从而得到 \(\nu=1\)。
>
> 换句话说：**“\(\nu=1\)” 本质上就是在告诉你：临界点的 relevant operator 是能量密度 \(\epsilon\)，而不是自旋 \(\sigma\)。**

