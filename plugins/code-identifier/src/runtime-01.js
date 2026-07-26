/**
 * Pot Code Identifier plugin.
 *
 * Pot loads plugin scripts with eval(), so this file intentionally has no imports.
 * Runtime dependencies are provided by Pot through options.utils.
 */

const PLUGIN_ID = 'plugin.com.elio.code-identifier';
const DICTIONARY_DB_PATH = `sqlite:plugins/translate/${PLUGIN_ID}/dictionary.db`;

const KNOWN_ACRONYMS = [
    'ACK', 'ADC', 'AES', 'AI', 'API', 'ASCII', 'BLE', 'BSP', 'CAN', 'CPU', 'CRC',
    'CSS', 'DAC', 'DMA', 'DNS', 'EEPROM', 'FIFO', 'GPIO', 'GPU', 'HAL', 'HTML',
    'HTTP', 'HTTPS', 'I2C', 'IDE', 'ID', 'IP', 'IPv4', 'IPv6', 'IRQ', 'ISR', 'JSON',
    'JTAG', 'MAC', 'MCU', 'NACK', 'NDEF', 'NFC', 'OTA', 'PID', 'PWM', 'RAM', 'EXTI',
    'REST', 'ROM', 'RPC', 'RS232', 'RS485', 'RTOS', 'SDK', 'SPI', 'SQL', 'SRAM',
    'SSH', 'ST25DV', 'TCP', 'TLS', 'UART', 'UDP', 'UI', 'UID', 'URI', 'URL',
    'USART', 'USB', 'UTF8', 'UUID', 'UX', 'XML'
];

const ACRONYM_MAP = new Map(KNOWN_ACRONYMS.map((item) => [item.toLowerCase(), item]));
const SORTED_ACRONYMS = [...KNOWN_ACRONYMS].sort((a, b) => b.length - a.length);

const ACTION_WORDS = new Set([
    'add', 'build', 'calculate', 'check', 'clear', 'clone', 'close', 'compare',
    'convert', 'copy', 'create', 'decode', 'delete', 'deserialize', 'disable',
    'enable', 'encode', 'fetch', 'filter', 'find', 'format', 'generate', 'get',
    'handle', 'init', 'initialize', 'join', 'load', 'merge', 'open', 'parse',
    'process', 'read', 'receive', 'reduce', 'remove', 'reset', 'retry', 'save',
    'search', 'send', 'serialize', 'set', 'sort', 'split', 'start', 'stop',
    'update', 'validate', 'verify', 'wait', 'write'
]);

const BOOLEAN_PREFIXES = new Set([
    'is', 'has', 'can', 'should', 'needs', 'supports', 'enabled', 'disabled',
    'available', 'valid', 'invalid'
]);
const FUNCTION_PREFIXES = new Set([...ACTION_WORDS, 'on']);
const FUNCTION_SUFFIXES = new Set([
    'callback', 'handler', 'hook', 'init', 'initialize', 'listener', 'process', 'processor'
]);

/**
 * Context-sensitive programming translations. These entries override the general
 * ECDICT meaning when the user selects programming mode.
 */
const PROGRAMMING_TERMS = {
    abstract: '抽象', access: '访问', account: '账户', action: '操作', activity: 'Activity',
    adapter: '适配器', add: '添加', address: '地址', algorithm: '算法', allocate: '分配',
    allocation: '分配', argument: '实参', array: '数组', asset: '资源', async: '异步',
    atomic: '原子', auth: '认证', available: '可用', await: '等待', base: '基础',
    batch: '批量', body: '请求体', boot: '启动', bootloader: '引导加载程序', branch: '分支',
    buffer: '缓冲区', build: '构建', builder: '构建器', bundle: 'Bundle', cache: '缓存',
    callback: '回调', calculate: '计算', can: '可以', cancel: '取消', channel: '通道', character: '角色', check: '检查', checksum: '校验和',
    class: '类', clear: '清除', client: '客户端', clone: '克隆', close: '关闭', code: '代码',
    column: '列', command: '命令', commit: '提交', compare: '比较', compiler: '编译器',
    component: '组件', compose: 'Compose', config: '配置', configuration: '配置',
    connection: '连接', constant: '常量', context: '上下文', controller: '控制器',
    convert: '转换', cookie: 'Cookie', copy: '复制', coroutine: '协程', count: '次数',
    create: '创建', current: '当前', data: '数据', database: '数据库', debug: '调试',
    decode: '解码', default: '默认', delay: '延时', delete: '删除', deserialize: '反序列化',
    device: '设备', directory: '目录', disable: '禁用', disabled: '已禁用', driver: '驱动',
    edge: '边', enable: '启用', enabled: '已启用', encode: '编码', encoder: '编码器',
    endpoint: '端点', entity: '实体', error: '错误', event: '事件', exception: '异常',
    expression: '表达式', factory: '工厂', failed: '失败', failure: '失败', fetch: '获取',
    field: '字段', file: '文件', filter: '过滤', find: '查找', firmware: '固件', flag: '标志',
    folder: '文件夹', format: '格式化', fragment: 'Fragment', frame: '帧', framework: '框架',
    function: '函数', future: 'Future', generate: '生成', get: '获取', graph: '图',
    handle: '处理', handler: '处理函数', hardware: '硬件', has: '具有', header: '请求头', heap: '堆',
    hook: '钩子', id: 'ID', ids: 'ID', index: '索引', init: '初始化', initialize: '初始化', instance: '实例', is: '是否',
    intent: 'Intent', interface: '接口', interpreter: '解释器', interrupt: '中断', interval: '间隔',
    invalid: '无效', item: '项', join: '连接', key: '键', library: '库', lifecycle: '生命周期',
    list: '列表', listener: '监听器', load: '加载', lock: '锁', log: '日志', login: '登录',
    logout: '退出登录', machine: '机器', manager: '管理器', map: '映射', member: '成员',
    memory: '内存', merge: '合并', message: '消息', method: '方法', middleware: '中间件',
    migration: '迁移', min: '最小', max: '最大', model: '模型', module: '模块', motor: '电机',
    mutex: '互斥锁', name: '名称', needs: '需要', network: '网络', next: '下一个', node: '节点',
    object: '对象', offset: '偏移', open: '打开', option: '选项', package: '包', packet: '数据包',
    parameter: '形参', parse: '解析', parser: '解析器', path: '路径', payload: '负载',
    permission: '权限', pointer: '指针', previous: '上一个', process: '进程', processor: '处理器',
    promise: 'Promise', property: '属性', protocol: '协议', provider: '提供方', query: '查询',
    queue: '队列', read: '读取', receive: '接收', record: '记录', reduce: '归并',
    reference: '引用', register: '寄存器', remaining: '剩余', remove: '移除', repository: '仓库',
    request: '请求', reset: '重置', resource: '资源', response: '响应', result: '结果',
    retry: '重试', retryable: '可重试', return: '返回', role: '角色', route: '路由', row: '行',
    runtime: '运行时', save: '保存', schema: '模式', search: '搜索', semaphore: '信号量',
    send: '发送', sensor: '传感器', serialize: '序列化', server: '服务器', service: '服务',
    session: '会话', set: '设置', setting: '设置', should: '应当', size: '大小', sort: '排序', source: '源',
    split: '拆分', stack: '栈', start: '启动', state: '状态', statement: '语句', status: '状态',
    stop: '停止', stream: '流', success: '成功', successful: '成功', sync: '同步', syntax: '语法',
    supports: '支持', table: '表', task: '任务', thread: '线程', timeout: '超时', timer: '定时器', token: '令牌',
    tokenizer: '分词器', trace: '跟踪', transaction: '事务', translate: '翻译', translation: '翻译',
    tree: '树', tuple: '元组', type: '类型', unknown: '未知', update: '更新', user: '用户',
    valid: '有效', validate: '校验', value: '值', variable: '变量', verify: '验证', view: '视图',
    viewmodel: '视图模型', wait: '等待', warning: '警告', watchdog: '看门狗', worker: '工作线程',
    write: '写入', actuator: '执行器', callbackflow: '回调流', currentflow: '状态流',
    observable: '可观察对象', dependency: '依赖', injection: '注入', navigation: '导航',
    firmwareupdate: '固件更新', bootloaderupdate: '引导加载程序更新'
};

const PROGRAMMING_PHRASES = {
    'access token': '访问令牌',
    'api key': 'API 密钥',
    'base url': '基础 URL',
    'callback function': '回调函数',
    'connection status': '连接状态',
    'current value': '当前值',
    'free rtos': 'FreeRTOS',
    'data frame': '数据帧',
    'error code': '错误码',
    'interrupt handler': '中断处理函数',
    'machine code': '机器码',
    'max retry count': '最大重试次数',
    'motor current': '电机电流',
    'read data': '读取数据',
    'refresh token': '刷新令牌',
    'remaining retryable character ids': '剩余可重试角色 ID',
    'request timeout': '请求超时',
    'response code': '响应码',
    'service instance': '服务实例',
    'service instance list': '服务实例列表',
    'service list': '服务列表',
    'source code': '源代码',
    'state machine': '状态机',
    'status code': '状态码',
    'translate service list': '翻译服务列表',
    'translation service': '翻译服务',
    'user config': '用户配置',
    'view model': '视图模型',
    'write data': '写入数据'
};

const CHINESE_PHRASES = {
    '最大重试次数': ['max', 'retry', 'count'],
    '剩余可重试角色': ['remaining', 'retryable', 'character'],
    '读取用户配置': ['read', 'user', 'config'],
    '检查连接状态': ['check', 'connection', 'status'],
    '连接是否成功': ['is', 'connection', 'successful'],
    '读取NFC配置': ['read', 'NFC', 'config'],
    '写入NFC数据': ['write', 'NFC', 'data'],
    '解析数据帧': ['parse', 'data', 'frame'],
    '校验数据帧': ['validate', 'data', 'frame'],
    '发送命令': ['send', 'command'],
    '接收响应': ['receive', 'response'],
    '重试失败角色': ['retry', 'failed', 'character'],
    '初始化设备': ['init', 'device'],
    '重置看门狗': ['reset', 'watchdog'],
    '更新固件': ['update', 'firmware'],
    '用户配置': ['user', 'config'],
    '连接状态': ['connection', 'status'],
    '数据帧': ['data', 'frame'],
    '错误码': ['error', 'code'],
    '状态码': ['status', 'code'],
    '重试次数': ['retry', 'count'],
    '函数名': ['function', 'name'],
    '变量名': ['variable', 'name'],
    '标识符': ['identifier'],
    '最大': ['max'], '最小': ['min'], '剩余': ['remaining'], '可重试': ['retryable'],
    '获取': ['get'], '读取': ['read'], '写入': ['write'], '设置': ['set'], '更新': ['update'],
    '删除': ['delete'], '创建': ['create'], '检查': ['check'], '验证': ['verify'], '校验': ['validate'],
