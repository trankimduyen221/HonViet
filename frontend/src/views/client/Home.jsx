/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiUser, FiShoppingCart } from 'react-icons/fi';
import {
    Box,
    Flex,
    Text,
    SimpleGrid,
    Button,
    Image,
    Badge,
    Spinner,
    useToast,
    HStack,
    Center,
    Input,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Avatar,
    MenuDivider
} from '@chakra-ui/react';
import axios from 'axios';

// Import các tài nguyên hình ảnh từ thư mục assets
import logoLotus from '../../assets/logo.jpg';
import vnFoodsImg from '../../assets/VNFoods.webp';
import banner1 from '../../assets/Running-Photos/bun-cha-la-mon-an-truyen-thong-viet-nam-noi-tieng.jpg';
import banner2 from '../../assets/Running-Photos/Screenshot 2026-07-14 094652.png';
import banner3 from '../../assets/Running-Photos/bun-cha-la-mon-an-truyen-thong-viet-nam-noi-tieng.jpg';
import banner4 from '../../assets/Running-Photos/2478b2e0c0e0eb8c99a0c1422478_mon-an-truyen-thong-viet-nam1.jpg';

export default function Home() {
    const [featuredFoods, setFeaturedFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const navigate = useNavigate();
    const toast = useToast();

    // Link ảnh mặc định phòng trường hợp link backend bị hỏng / 404
    const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=800';

    const [homeSearch, setHomeSearch] = useState('');

    const introRef = useRef(null);
    const footerRef = useRef(null);

    const token = localStorage.getItem('accessToken');
    const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('username'));
    const [currentAvatar, setCurrentAvatar] = useState(localStorage.getItem('avatar') || '');
    const userRole = localStorage.getItem('role') || '';

    // Hàm chuẩn hóa đường dẫn ảnh từ Backend gửi về
    const formatImageUrl = (url) => {
        if (!url || typeof url !== 'string' || url.trim() === '') return DEFAULT_FOOD_IMAGE;
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
            return url;
        }
        return `https://honviet-ryt3.onrender.com${url.startsWith('/') ? '' : '/'}${url}`;
    };

    useEffect(() => {
        const handleStorageChange = () => {
            setCurrentUsername(localStorage.getItem('username'));
            setCurrentAvatar(localStorage.getItem('avatar') || '');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        if (token && userRole.toUpperCase() === 'ADMIN') {
            navigate('/admin/foods');
        } else if (token && userRole.toUpperCase() === 'SHIPPER') {
            navigate('/shipper/orders');
        }
    }, [token, userRole, navigate]);

    const bannerImages = [banner1, banner2, banner3, banner4];
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

    useEffect(() => {
        if (loading) return;
        const timer = setInterval(() => {
            setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [loading, bannerImages.length]);

    const omegaGreen = '#930a0a';
    const omegaGrayBg = '#F5F5F5';

    const scrollToIntro = () => {
        if (introRef.current) {
            introRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const scrollToFooter = () => {
        if (footerRef.current) {
            footerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const updateCartCount = () => {
        const cart = JSON.parse(localStorage.getItem('honVietCart')) || [];
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(total);
    };

    useEffect(() => {
        const fetchFeaturedFoods = async () => {
            try {
                setLoading(true);
                const response = await axios.get('https://honviet-ryt3.onrender.com/api/foods');
                setFeaturedFoods(response.data.slice(0, 4));
                updateCartCount();
                setLoading(false);
            } catch (err) {
                console.error('Lỗi tải dữ liệu:', err);
                setLoading(false);
            }
        };
        fetchFeaturedFoods();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('username');
        localStorage.removeItem('avatar');
        localStorage.removeItem('role');
        toast({
            title: "Đã đăng xuất",
            description: "Đăng xuất tài khoản thành công",
            status: "info",
            duration: 2000,
            position: "top"
        });
        navigate("/client/auth");
    };

    const addToCart = (food) => {
        let cart = JSON.parse(localStorage.getItem('honVietCart')) || [];
        const existingItem = cart.find(item => item.foodId === food.foodId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                foodId: food.foodId,
                foodName: food.foodName,
                price: food.price,
                imageUrl: formatImageUrl(food.imageUrl),
                quantity: 1
            });
        }
        localStorage.setItem('honVietCart', JSON.stringify(cart));
        updateCartCount();
        toast({
            title: 'Đã thêm vào giỏ! 🛒',
            description: `Thêm thành công món ${food.foodName} vào giỏ hàng.`,
            status: 'success',
            duration: 1500,
            isClosable: true,
            position: 'top'
        });
    };

    const handleHeaderSearch = () => {
        navigate('/client/menu', { state: { focusSearch: true } });
    };

    if (loading) {
        return (
            <Center minH="50vh" flexDirection="column" gap={3}>
                <Spinner size="xl" color={omegaGreen} thickness="4px" />
                <Text fontWeight="semibold" color="gray.600">Đang tải Hồn Việt...</Text>
            </Center>
        );
    }

    return (
        <Box bg="white" minH="100vh">
            <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700;900&family=Oswald:wght@500;700&family=Playfair+Display:ital,wght@0,600;1,600&family=Quicksand:wght@500;600;700;900&display=swap" rel="stylesheet" />

            <Box bg={omegaGreen} color="white" py="10px" textAlign="center" fontSize="13px" fontWeight="bold" letterSpacing="1.5px">
                HỒN VIỆT — MỸ VỊ CHÍNH THỐNG ĐẬM ĐÀ QUÊ HƯƠNG
            </Box>

            {/* HEADER */}
            <Box bg="white" borderBottom="1px solid #EDEDED" py="12px" px={{ base: '15px', md: '30px' }} position="sticky" top="0" zIndex="10">
                <Flex maxW="1400px" mx="auto" align="center" justify="space-between">
                    <HStack spacing="12px" cursor="pointer" onClick={() => navigate('/')}>
                        <Image src={logoLotus} alt="Hon Viet Logo" boxSize="50px" objectFit="contain" />
                        <Box display={{ base: 'none', sm: 'block' }}>
                            <Text fontSize="18px" fontFamily='"Comfortaa", "Quicksand", sans-serif' fontWeight="900" color={omegaGreen} lineHeight="none">
                                HỒN VIỆT
                            </Text>
                            <Text fontSize="9px" color="gray.500" fontWeight="bold" mt="2px">SINCE 2026</Text>
                        </Box>
                    </HStack>

                    <HStack spacing="24px" display={{ base: 'none', lg: 'flex' }} fontSize="13px" fontWeight="700" color="#333333">
                        <Text color={omegaGreen} cursor="pointer" borderBottom={`2px solid ${omegaGreen}`} pb="4px" onClick={() => navigate('/')}>TRANG CHỦ</Text>
                        <Text _hover={{ color: omegaGreen }} cursor="pointer" onClick={() => navigate('/client/menu')}>THỰC ĐƠN</Text>
                        <Text _hover={{ color: omegaGreen }} cursor="pointer" onClick={scrollToIntro}>GIỚI THIỆU</Text>
                        <Text _hover={{ color: omegaGreen }} cursor="pointer" onClick={scrollToFooter}>LIÊN HỆ</Text>
                    </HStack>

                    <HStack spacing="25px">
                        <HStack spacing="8px" display={{ base: 'none', md: 'flex' }} cursor="pointer" onClick={scrollToFooter}>
                            <Text fontSize="20px">📞</Text>
                            <Box>
                                <Text fontSize="11px" color="gray.500" fontWeight="600" mb="-3px">Liên hệ đặt món</Text>
                                <Text fontSize="15px" fontWeight="800" color={omegaGreen}>1900 55 88 50</Text>
                            </Box>
                        </HStack>

                        <HStack spacing="12px">
                            <IconButton
                                icon={<FiSearch size="20px" />}
                                aria-label="Search"
                                variant="solid"
                                bg="#EFEFEF"
                                color="#333"
                                borderRadius="full"
                                boxSize="45px"
                                _hover={{ bg: '#E2E2E2', color: omegaGreen }}
                                onClick={handleHeaderSearch}
                            />

                            <Menu isLazy placement="bottom-end">
                                <MenuButton style={{ outline: 'none', border: 'none' }}>
                                    {token && currentUsername ? (
                                        <Avatar
                                            name={currentUsername}
                                            src={formatImageUrl(currentAvatar)}
                                            size="sm"
                                            bg={omegaGreen}
                                            color="white"
                                            fontWeight="bold"
                                            cursor="pointer"
                                            boxSize="45px"
                                            objectFit="cover"
                                            _hover={{ opacity: 0.85 }}
                                        />
                                    ) : (
                                        <IconButton icon={<FiUser size="20px" />} aria-label="Account" variant="solid" bg="#EFEFEF" color="#333" borderRadius="full" boxSize="45px" _hover={{ bg: '#E2E2E2', color: omegaGreen }} />
                                    )}
                                </MenuButton>
                                <MenuList minW="185px" borderRadius="12px" border="1px solid #EAEAEA" boxShadow="0 10px 30px rgba(0, 0, 0, 0.08)" py="4px" overflow="hidden">
                                    {token && currentUsername ? (
                                        <>
                                            <Box px="14px" py="8px" bg="gray.50">
                                                <Text fontSize="10px" fontWeight="700" color="gray.400" letterSpacing="0.8px">ĐANG ĐĂNG NHẬP</Text>
                                                <Text fontSize="13px" fontWeight="800" color="gray.800" mt="1px">{currentUsername}</Text>
                                                <Badge colorScheme={userRole.toUpperCase() === 'ADMIN' ? 'red' : 'green'} mt="4px" fontSize="9px" px="5px" borderRadius="4px">
                                                    {userRole.toUpperCase()}
                                                </Badge>
                                            </Box>
                                            <MenuDivider borderColor="#EAEAEA" my="4px" />
                                            {userRole.toUpperCase() === 'ADMIN' && (
                                                <MenuItem fontSize="13px" fontWeight="700" color={omegaGreen} py="8px" px="14px" _hover={{ bg: 'red.50' }} onClick={() => navigate("/admin/foods")}>
                                                    Trang quản trị (Admin)
                                                </MenuItem>
                                            )}
                                            <MenuItem fontSize="13px" fontWeight="600" color="gray.700" py="8px" px="14px" _hover={{ bg: 'gray.50', color: omegaGreen }} onClick={() => navigate("/client/profile")}>⚙️ Thông tin cá nhân</MenuItem>
                                            <MenuItem fontSize="13px" fontWeight="600" color="gray.700" py="8px" px="14px" _hover={{ bg: 'gray.50', color: omegaGreen }} onClick={() => navigate("/client/history")}>Đơn hàng của tôi</MenuItem>
                                            <MenuDivider borderColor="#EAEAEA" my="4px" />
                                            <MenuItem fontSize="13px" fontWeight="700" color="red.600" py="8px" px="14px" _hover={{ bg: 'red.50' }} onClick={handleLogout}>Đăng xuất</MenuItem>
                                        </>
                                    ) : (
                                        <>
                                            <MenuItem fontSize="13px" fontWeight="600" color="gray.700" py="8px" px="14px" _hover={{ bg: 'gray.50', color: omegaGreen }} onClick={() => navigate("/client/auth")}>Đăng nhập</MenuItem>
                                            <MenuItem fontSize="13px" fontWeight="600" color="gray.700" py="8px" px="14px" _hover={{ bg: 'gray.50', color: omegaGreen }} onClick={() => navigate("/client/auth")}>Đăng ký tài khoản</MenuItem>
                                        </>
                                    )}
                                </MenuList>
                            </Menu>

                            <Box position="relative">
                                <IconButton icon={<FiShoppingCart size="20px" />} aria-label="Cart" variant="solid" bg="#EFEFEF" color="#333" borderRadius="full" boxSize="45px" _hover={{ bg: '#E2E2E2', color: omegaGreen }} onClick={() => navigate("/client/cart")} />
                                {cartCount > 0 && (
                                    <Box position="absolute" top="-2px" right="-2px" bg="#114217" color="white" borderRadius="full" minW="18px" h="18px" display="flex" alignItems="center" justifyContent="center" fontSize="11px" fontWeight="bold" px="4px" zIndex="3">
                                        {cartCount}
                                    </Box>
                                )}
                            </Box>
                        </HStack>
                    </HStack>
                </Flex>
            </Box>

            {/* BANNER SLIDE */}
            <Box maxW="1400px" mx="auto" mt="15px" px={{ base: '15px', md: '30px' }}>
                <Box w="100%" h={{ base: '200px', md: '450px' }} borderRadius="8px" overflow="hidden" position="relative" boxShadow="0 4px 12px rgba(0,0,0,0.05)">
                    {bannerImages.map((imgUrl, idx) => (
                        <Image key={idx} src={imgUrl} alt={`Banner ${idx}`} w="100%" h="100%" objectFit="cover" objectPosition="center 20%" position="absolute" top="0" left="0" opacity={currentBannerIndex === idx ? 1 : 0} transition="opacity 0.8s ease-in-out" />
                    ))}
                    <HStack position="absolute" bottom="15px" left="50%" transform="translateX(-50%)" spacing="8px" zIndex="2">
                        {bannerImages.map((_, idx) => (
                            <Box key={idx} w="8px" h="8px" borderRadius="full" bg={currentBannerIndex === idx ? "#E5A93C" : "whiteAlpha.600"} cursor="pointer" onClick={() => setCurrentBannerIndex(idx)} transition="all 0.3s" />
                        ))}
                    </HStack>
                </Box>
            </Box>

            {/* KHU VỰC GIỚI THIỆU NGẮN */}
            <Box ref={introRef} py="60px" textAlign="center" maxW="800px" mx="auto" px="20px" scrollMarginTop="80px">
                <Text fontSize="32px" fontWeight="700" fontFamily="'Playfair Display', serif" color={omegaGreen} mb="20px">
                    Tinh Hoa Ẩm Thực Việt Truyền Thống
                </Text>
                <Text fontSize="16px" color="gray.600" lineHeight="1.8" fontFamily="'Quicksand', sans-serif" fontWeight="500" textAlign="justify">
                    Chào mừng bạn đến với Hồn Việt – nơi lưu giữ và tôn vinh những giá trị nguyên bản của ẩm thực Việt.
                    Mỗi món ăn là sự hòa quyện giữa nguyên liệu tươi sạch trong ngày cùng tâm huyết từ những nghệ nhân bếp dày dạn kinh nghiệm.
                    Chúng tôi mời bạn tạm gác lại nhịp sống hối hả, để thưởng thức phong vị đậm đà và tận hiện không gian ấm cúng,
                    thân thuộc như chính bữa cơm gia đình.
                </Text>
            </Box>

            {/* KHU VỰC MÓN ĂN TIÊU BIỂU (BEST SELLER) */}
            <Box p={{ base: '15px', md: '30px' }} maxW="1400px" mx="auto">
                <Flex justify="space-between" align="center" mb="3px" borderBottom="2px solid #930a0a" pb="10px">
                    <Text fontSize="18px" fontWeight="900" color="#222">MÓN NGON GỢI Ý CHO BẠN</Text>
                    <Button size="sm" variant="link" color={omegaGreen} fontWeight="700" onClick={() => navigate('/client/menu')}>
                        Xem tất cả thực đơn →
                    </Button>
                </Flex>

                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="30px" mt="30px">
                    {featuredFoods.map((food) => {
                        const foodImg = formatImageUrl(food.imageUrl);

                        return (
                            <Box key={food.foodId} bg="white" border="1px solid #EAEAEA" transition="all 0.2s ease" _hover={{ boxShadow: '0 10px 20px rgba(0,0,0,0.05)', borderColor: omegaGreen }} display="flex" flexDirection="column">
                                <Box overflow="hidden" position="relative">
                                    <Image
                                        src={foodImg}
                                        fallbackSrc={DEFAULT_FOOD_IMAGE}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = DEFAULT_FOOD_IMAGE;
                                        }}
                                        alt={food.foodName}
                                        w="100%"
                                        h="220px"
                                        objectFit="cover"
                                        transition="transform 0.3s"
                                        _hover={{ transform: 'scale(1.05)' }}
                                    />
                                    <Badge position="absolute" top="10px" left="10px" bg={omegaGreen} color="white" borderRadius="0px" px="8px" py="3px" fontSize="10px" fontWeight="bold">
                                        {food.category?.name || food.category?.categoryName || 'MÓN NGON'}
                                    </Badge>
                                </Box>
                                <Box p="15px" flex="1" display="flex" flexDirection="column" justify="space-between">
                                    <Box mb="10px">
                                        <Text color="#222222" fontSize="14px" fontFamily='"Comfortaa", sans-serif' fontWeight="900" noOfLines={1} textTransform="uppercase">
                                            {food.foodName}
                                        </Text>
                                        <Text color="gray.500" fontSize="12px" mt="6px" noOfLines={2} lineHeight="1.5" fontWeight="600">
                                            {food.description || 'Hương vị thơm ngon đậm đà truyền thống.'}
                                        </Text>
                                    </Box>
                                    <Flex justify="space-between" align="center" pt="10px" borderTop="1px solid #F5F5F5">
                                        <Text color="#A81D1D" fontSize="16px" fontWeight="900">{food.price ? food.price.toLocaleString('vi-VN') : 0}đ</Text>
                                        <Button size="sm" bg={omegaGreen} color="white" _hover={{ bg: '#052918' }} borderRadius="3px" px="14px" fontSize="11px" fontWeight="bold" onClick={() => addToCart(food)}>MUA NGAY</Button>
                                    </Flex>
                                </Box>
                            </Box>
                        );
                    })}
                </SimpleGrid>

                <Center mt="50px">
                    <Button size="lg" bg={omegaGreen} color="white" px="40px" py="26px" fontSize="15px" fontWeight="bold" borderRadius="3px" _hover={{ bg: '#052918', transform: 'translateY(-2px)' }} transition="all 0.2s" onClick={() => navigate('/client/menu')}>
                        KHÁM PHÁ TOÀN BỘ THỰC ĐƠN HỒN VIỆT
                    </Button>
                </Center>
            </Box>

            {/* BANNER SỐ LIỆU */}
            <Box mt="60px" position="relative" backgroundImage={`url(${vnFoodsImg})`} backgroundSize="cover" backgroundPosition="center center" backgroundAttachment={{ base: 'scroll', md: 'fixed' }} py={{ base: '50px', md: '75px' }} px="20px" overflow="hidden">
                <Flex position="relative" zIndex="2" maxW="1200px" mx="auto" direction={{ base: 'column', md: 'row' }} justify="space-around" align="center" gap={{ base: '45px', md: '0' }} color="white">
                    <HStack spacing="18px" align="center">
                        <svg width="46px" height="46px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><line x1="9" y1="6" x2="15" y2="6" /><line x1="9" y1="10" x2="15" y2="10" /><line x1="9" y1="14" x2="15" y2="14" /></svg>
                        <Text fontSize="11px" fontWeight="700" color="gray.300" letterSpacing="1px">THỰC ĐƠN ĐA DẠNG</Text>
                    </HStack>
                    <HStack spacing="18px" align="center">
                        <svg width="46px" height="46px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22h20" /><path d="M5 18a7 7 0 0 1 14 0H5z" /><circle cx="12" cy="11" r="1" /></svg>
                        <Box>
                            <Text fontSize="34px" fontWeight="700" fontFamily="'Oswald', sans-serif" lineHeight="1.1" mb="1px">+ 500</Text>
                            <Text fontSize="11px" fontWeight="700" color="gray.300" letterSpacing="1px">KHÁCH HÀNG MỖI NGÀY</Text>
                        </Box>
                    </HStack>
                    <HStack spacing="18px" align="center">
                        <svg width="46px" height="46px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18V9a6 6 0 0 1 12 0v9" /><path d="M18 18H6a2 2 0 0 0 0 4h12a2 2 0 0 0 0-4z" /><path d="M12 2v3" /></svg>
                        <Box>
                            <Text fontSize="34px" fontWeight="700" fontFamily="'Oswald', sans-serif" lineHeight="1.1" mb="1px">+ 10</Text>
                            <Text fontSize="11px" fontWeight="700" color="gray.300" letterSpacing="1px">NĂM KINH NGHIỆM</Text>
                        </Box>
                    </HStack>
                </Flex>
            </Box>

            {/* ĐĂNG KÝ NHẬN TIN */}
            <Box bg="white" borderBottom="1px solid #EAEAEA" py="20px" px="20px">
                <Flex maxW="1400px" mx="auto" direction={{ base: 'column', lg: 'row' }} justify="space-between" align="center" gap="20px">
                    <Flex direction={{ base: 'column', sm: 'row' }} align="center" gap="10px" w={{ base: '100%', lg: 'auto' }}>
                        <HStack color="#333333" fontSize="12px" fontWeight="800" spacing="6px">
                            <Text fontSize="14px">✉️</Text>
                            <Text letterSpacing="0.5px" whiteSpace="nowrap">ĐĂNG KÝ NHẬN TIN:</Text>
                        </HStack>
                        <Input placeholder="Nhập email của bạn" px="15px" h="38px" w={{ base: '100%', sm: '350px' }} border="1px solid #CCCCCC" borderRadius="0px" fontSize="13px" _focus={{ borderColor: omegaGreen, boxShadow: 'none' }} />
                        <Button bg={omegaGreen} color="white" _hover={{ bg: '#052918' }} fontSize="12px" fontWeight="800" borderRadius="0px" px="25px" h="38px" w={{ base: '100%', sm: 'auto' }}>ĐĂNG KÝ</Button>
                    </Flex>
                    <HStack spacing="10px" fontSize="12px" fontWeight="800" color="#333333" justify="center">
                        <Text letterSpacing="0.5px">KẾT NỐI VỚI CHÚNG TÔI:</Text>
                        <Center w="32px" h="32px" bg={omegaGreen} color="white" cursor="pointer" _hover={{ opacity: 0.9 }}>f</Center>
                        <Center w="32px" h="32px" bg={omegaGreen} color="white" cursor="pointer" _hover={{ opacity: 0.9 }}>ig</Center>
                        <Center w="32px" h="32px" bg={omegaGreen} color="white" cursor="pointer" _hover={{ opacity: 0.9 }}>yt</Center>
                    </HStack>
                </Flex>
            </Box>

            {/* FOOTER CHIA CỘT */}
            <Box ref={footerRef} bg="white" py="30px" px={{ base: '20px', md: '40px' }}>
                <Flex maxW="1400px" mx="auto" direction={{ base: 'column', md: 'row' }} justify="space-between" align="flex-start" gap="40px">
                    <SimpleGrid columns={{ base: 1, sm: 3 }} spacing="40px" flex="1" maxW="900px">
                        <Box>
                            <Text fontWeight="800" color="#222222" fontSize="13px" mb="18px" letterSpacing="0.5px">CHÍNH SÁCH</Text>
                            <Flex direction="column" gap="12px" fontSize="13px" color="gray.600" fontWeight="600">
                                <Text _hover={{ color: omegaGreen }} cursor="pointer">Tìm kiếm</Text>
                                <Text _hover={{ color: omegaGreen }} cursor="pointer" onClick={scrollToIntro}>Giới thiệu</Text>
                                <Text _hover={{ color: omegaGreen }} cursor="pointer">Hệ Thống Cửa Hàng</Text>
                            </Flex>
                        </Box>
                        <Box>
                            <Text fontWeight="800" color="#222222" fontSize="13px" mb="18px" letterSpacing="0.5px">SẢN PHẨM</Text>
                            <Flex direction="column" gap="12px" fontSize="13px" color="gray.600" fontWeight="600">
                                <Text _hover={{ color: omegaGreen }} cursor="pointer">Sản phẩm khuyến mãi</Text>
                                <Text _hover={{ color: omegaGreen }} cursor="pointer">Sản phẩm nổi bật</Text>
                                <Text _hover={{ color: omegaGreen }} cursor="pointer">Tất cả sản phẩm</Text>
                            </Flex>
                        </Box>
                        <Box>
                            <Text fontWeight="800" color="#222222" fontSize="13px" mb="18px" letterSpacing="0.5px">LIÊN KẾT</Text>
                            <Flex direction="column" gap="12px" fontSize="13px" color="gray.600" fontWeight="600">
                                <Text _hover={{ color: omegaGreen }} cursor="pointer">Tin tức ẩm thực</Text>
                                <Text _hover={{ color: omegaGreen }} cursor="pointer">Cộng đồng tin cậy</Text>
                            </Flex>
                        </Box>
                    </SimpleGrid>

                    <Flex direction={{ base: 'row', md: 'column' }} gap="10px" w={{ base: '100%', md: 'auto' }} justify="center">
                        <Center w="40px" h="40px" bg={omegaGreen} color="white" borderRadius="full" boxShadow="md" cursor="pointer" _hover={{ transform: 'scale(1.1)' }} transition="transform 0.2s">📞</Center>
                        <Center w="40px" h="40px" bg={omegaGreen} color="white" borderRadius="full" boxShadow="md" cursor="pointer" _hover={{ transform: 'scale(1.1)' }} transition="transform 0.2s">✉️</Center>
                        <Center w="40px" h="40px" bg={omegaGreen} color="white" borderRadius="full" boxShadow="md" cursor="pointer" _hover={{ transform: 'scale(1.1)' }} transition="transform 0.2s">📍</Center>
                    </Flex>
                </Flex>
                <Box borderTop="1px solid #EAEAEA" mt="40px" pt="20px" textAlign="center" fontSize="11px" color="gray.400" fontWeight="bold">
                    Copyright © 2026 honvietfoods. Powered by Yuri Project
                </Box>
            </Box>
        </Box>
    );
}