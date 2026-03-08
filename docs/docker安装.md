当然可以。Docker Desktop 默认安装在C盘，但我们可以通过几种方法把它安装到其他盘，关键是\*\*在安装时就通过命令行来指定路径\*\*。这里有两种推荐的方法：



---



\## 🔧 方法一：通过命令行直接指定安装路径（最干净）



这是最推荐的方法，安装完成后所有文件都会在你指定的目录，没有残留 。



\### 操作步骤：

1\. \*\*以管理员身份打开 PowerShell\*\*（右键点击开始菜单 → Windows PowerShell（管理员））

2\. \*\*切换到安装包所在目录\*\*（假设下载到 Downloads 文件夹）：

&nbsp;  ```powershell

&nbsp;  cd C:\\Users\\你的用户名\\Downloads

&nbsp;  ```

3\. \*\*执行安装命令\*\*（修改为你想要的路径，如D盘）：

&nbsp;  ```powershell

&nbsp;  .\\"Docker Desktop Installer.exe" install --accept-license --installation-dir="D:\\Program Files\\Docker"

&nbsp;  ```



如果想同时指定镜像和容器的存储位置，可以使用更完整的命令：

```powershell

.\\"Docker Desktop Installer.exe" install --accept-license --installation-dir="D:\\Program Files\\Docker" --wsl-default-data-root="D:\\Program Files\\Docker\\data"

```





\### ⚠️ 注意事项：

\- \*\*必须提前创建好目标文件夹\*\*（如 `D:\\Program Files\\Docker`），否则可能报错 

\- 如果之前安装过Docker，需要先卸载干净





\## 🔗 方法二：使用软链接（符号链接）



如果你已经安装了Docker，或者想用更"取巧"的方式，可以通过创建目录软链接来实现 。



\### 操作步骤：

1\. \*\*删除原有的Docker目录\*\*（如果存在）：

&nbsp;  ```powershell

&nbsp;  Remove-Item "C:\\Program Files\\Docker" -Recurse -Force

&nbsp;  ```

2\. \*\*创建软链接\*\*（将C盘路径映射到D盘）：

&nbsp;  ```powershell

&nbsp;  cmd /c mklink /j "C:\\Program Files\\Docker" "D:\\Program Files\\Docker"

&nbsp;  ```

3\. \*\*正常安装Docker Desktop\*\*（双击安装包）



这样安装程序会以为自己在往C盘写数据，实际上都去了D盘 。



\### ⚠️ 缺点：

\- 部分用户反馈这种方法可能会导致启动异常 

\- 某些文件可能仍有残留留在C盘 





\## 💡 我的建议



| 方法 | 适用场景 | 推荐度 |

|------|----------|--------|

| \*\*方法一（命令行安装）\*\* | 全新安装，希望彻底迁移到其他盘 | ⭐⭐⭐⭐⭐ |

| \*\*方法二（软链接）\*\* | 已安装Docker不想重装，或命令行操作不熟练 | ⭐⭐ |



\*\*如果你还没安装Docker，强烈建议使用方法一\*\*，一步到位，后期省心。



---



\### 🔍 补充：如何迁移已安装的Docker数据？



如果你已经安装了Docker，想把现有的镜像、容器数据也迁移到D盘，可以参考以下步骤（以WSL 2后端为例）：



1\. \*\*停止Docker Desktop\*\*

2\. \*\*导出当前的WSL数据\*\*：

&nbsp;  ```powershell

&nbsp;  wsl --export docker-desktop-data D:\\docker\\docker-desktop-data.tar

&nbsp;  ```

3\. \*\*注销原有的WSL实例\*\*：

&nbsp;  ```powershell

&nbsp;  wsl --unregister docker-desktop-data

&nbsp;  ```

4\. \*\*导入到新位置\*\*：

&nbsp;  ```powershell

&nbsp;  wsl --import docker-desktop-data D:\\docker\\data D:\\docker\\docker-desktop-data.tar --version 2

&nbsp;  ```

5\. \*\*重启Docker Desktop\*\* 



这样就能把Docker占用的虚拟硬盘文件也搬到D盘了。

